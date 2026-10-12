import assert from "node:assert/strict";
import { test } from "node:test";
import { getQuotaUsage } from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import {
  CF_FREE_TIER_DAILY_REFERENCE,
  createQuotaGuard,
  quotaDay,
  quotaLimitEnvName,
  resolveQuotaLimits,
} from "./index.ts";

const FIXED_NOW = () => new Date("2026-01-15T12:00:00.000Z");

function loggerSpy(): {
  warn(message: string, fields?: Record<string, unknown>): void;
  warnings: { message: string; fields?: Record<string, unknown> }[];
} {
  const warnings: { message: string; fields?: Record<string, unknown> }[] = [];
  return {
    warn: (message, fields) => warnings.push({ message, fields }),
    warnings,
  };
}

test("quotaDay uses the UTC day", () => {
  assert.equal(quotaDay(new Date("2026-01-15T23:59:59.999Z")), "2026-01-15");
  assert.equal(quotaDay(new Date("2026-01-16T00:00:00.000Z")), "2026-01-16");
});

test("resolveQuotaLimits: env wins over reference, malformed env falls back", () => {
  const limits = resolveQuotaLimits({
    QUOTA_LIMIT_AI: "25",
    QUOTA_LIMIT_D1: "not-a-number",
    QUOTA_LIMIT_R2: "-4",
  });
  assert.deepEqual(limits.ai, {
    kind: "ai",
    limit: 25,
    limitSource: "env",
    reference: null,
  });
  assert.deepEqual(limits.d1, {
    kind: "d1",
    limit: CF_FREE_TIER_DAILY_REFERENCE.d1,
    limitSource: "reference",
    reference: CF_FREE_TIER_DAILY_REFERENCE.d1,
  });
  assert.deepEqual(limits.r2, {
    kind: "r2",
    limit: null,
    limitSource: "none",
    reference: null,
  });
  assert.equal(quotaLimitEnvName("ai"), "QUOTA_LIMIT_AI");
});

test("checkQuota allows within budget and refuses over budget", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const guard = createQuotaGuard({
      db,
      env: { QUOTA_LIMIT_AI: "3" },
      now: FIXED_NOW,
    });
    assert.equal((await guard.checkQuota("ai", 1)).allowed, true);
    await guard.recordUsage("ai", 2);
    const ok = await guard.checkQuota("ai", 1);
    assert.equal(ok.allowed, true);
    assert.equal(ok.remaining, 0);
    await guard.recordUsage("ai", 1);
    const blocked = await guard.checkQuota("ai", 1);
    assert.deepEqual(blocked, {
      allowed: false,
      reason: "quota_exceeded",
      remaining: 0,
      usageSource: "d1",
    });
  } finally {
    close();
  }
});

test("MSTUDIO_AI_KILL=1 blocks only the ai kind", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const guard = createQuotaGuard({
      db,
      env: { MSTUDIO_AI_KILL: "1" },
      now: FIXED_NOW,
    });
    assert.equal(guard.aiKillSwitch, true);
    const ai = await guard.checkQuota("ai", 1);
    assert.equal(ai.allowed, false);
    assert.equal(ai.reason, "ai_kill_switch");
    const d1 = await guard.checkQuota("d1", 10);
    assert.equal(d1.allowed, true);
    assert.equal(guard.limits.d1.limit, CF_FREE_TIER_DAILY_REFERENCE.d1);
  } finally {
    close();
  }
});

test("kill switch parses truthy spellings case-insensitively", async () => {
  for (const value of ["1", "true", "TRUE", " yes ", "On"]) {
    const guard = createQuotaGuard({ env: { MSTUDIO_AI_KILL: value } });
    assert.equal(guard.aiKillSwitch, true, value);
  }
  for (const value of ["0", "false", "", "off", undefined]) {
    const guard = createQuotaGuard({ env: { MSTUDIO_AI_KILL: value } });
    assert.equal(guard.aiKillSwitch, false, String(value));
  }
});

test("memory-only guard (no db) still blocks when the env limit is spent", async () => {
  const guard = createQuotaGuard({
    env: { QUOTA_LIMIT_AI: "2" },
    now: FIXED_NOW,
  });
  await guard.recordUsage("ai", 2);
  const blocked = await guard.checkQuota("ai", 1);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "quota_exceeded");
  assert.equal(blocked.usageSource, "memory");
});

test("usage is persisted per UTC day in D1", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const guard = createQuotaGuard({ db, env: {}, now: FIXED_NOW });
    await guard.recordUsage("d1", 4);
    await guard.recordUsage("d1", 6);
    const row = await getQuotaUsage(db, "d1", "2026-01-15");
    assert.equal(row?.count, 2);
    assert.equal(row?.costSum, 10);
    const summary = await guard.summary();
    const d1 = summary.kinds.find((kind) => kind.kind === "d1");
    assert.equal(d1?.used, 10);
    assert.equal(summary.usageSource, "d1");
  } finally {
    close();
  }
});

test("D1 read failure falls back to in-memory totals", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const logger = loggerSpy();
    const guard = createQuotaGuard({
      db,
      env: { QUOTA_LIMIT_AI: "2" },
      now: FIXED_NOW,
      logger,
    });
    await guard.recordUsage("ai", 1);
    // Simulate a D1 outage after the usage was recorded. Real D1
    // prepare() is synchronous, so the failure throws synchronously.
    const broken = {
      prepare(): never {
        throw new Error("D1 unavailable");
      },
    };
    const guard2 = createQuotaGuard({
      db: broken as never,
      env: { QUOTA_LIMIT_AI: "2" },
      now: FIXED_NOW,
      logger,
    });
    // Memory totals are per-isolate: guard2 starts empty, so it allows…
    const fresh = await guard2.checkQuota("ai", 2);
    assert.equal(fresh.allowed, true);
    assert.equal(fresh.usageSource, "memory");
    // …and the write failure is logged, never thrown.
    await guard2.recordUsage("ai", 5);
    assert.equal(
      logger.warnings.some((w) => w.message === "quota_usage_write_failed"),
      true,
    );
    const over = await guard2.checkQuota("ai", 1);
    assert.equal(over.allowed, false);
    assert.equal(over.reason, "quota_exceeded");
    assert.equal(over.usageSource, "memory");
    // Original guard still sees its D1-backed usage.
    const original = await guard.checkQuota("ai", 1);
    assert.equal(original.usageSource, "d1");
  } finally {
    close();
  }
});

test("recordUsage is a no-op for zero/negative/NaN cost and never throws", async () => {
  const guard = createQuotaGuard({ env: {}, now: FIXED_NOW });
  await guard.recordUsage("ai", 0);
  await guard.recordUsage("ai", -1);
  await guard.recordUsage("ai", Number.NaN);
  const summary = await guard.summary();
  const ai = summary.kinds.find((kind) => kind.kind === "ai");
  assert.equal(ai?.used, 0);
  assert.equal(ai?.limit, null);
  assert.equal(ai?.estimate, false);
});

test("summary reports limits, estimates and the kill switch", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const guard = createQuotaGuard({
      db,
      env: { MSTUDIO_AI_KILL: "true", QUOTA_LIMIT_R2: "100" },
      now: FIXED_NOW,
    });
    await guard.recordUsage("r2", 30);
    const summary = await guard.summary();
    assert.equal(summary.day, "2026-01-15");
    assert.equal(summary.aiKillSwitch, true);
    assert.equal(summary.usageSource, "d1");
    assert.deepEqual(
      summary.kinds.map((kind) => [kind.kind, kind.limit, kind.estimate]),
      [
        ["ai", null, false],
        ["d1", CF_FREE_TIER_DAILY_REFERENCE.d1, true],
        ["r2", 100, false],
      ],
    );
    const r2 = summary.kinds.find((kind) => kind.kind === "r2");
    assert.equal(r2?.used, 30);
    assert.equal(r2?.remaining, 70);
    assert.equal(r2?.limitSource, "env");
  } finally {
    close();
  }
});
