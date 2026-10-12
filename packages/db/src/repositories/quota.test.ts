import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getQuotaUsage,
  listQuotaUsage,
  recordQuotaUsage,
} from "../index.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const DAY = "2026-01-01";
const NOW = "2026-01-01T12:00:00.000Z";

test("recordQuotaUsage accumulates count and cost_sum for one (kind, day)", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await recordQuotaUsage(db, {
      kind: "d1",
      day: DAY,
      count: 3,
      costSum: 120,
      now: NOW,
    });
    await recordQuotaUsage(db, {
      kind: "d1",
      day: DAY,
      count: 2,
      costSum: 80,
      now: NOW,
    });
    const usage = await getQuotaUsage(db, "d1", DAY);
    assert.deepEqual(usage, {
      kind: "d1",
      day: DAY,
      count: 5,
      costSum: 200,
      updatedAt: NOW,
    });
  } finally {
    close();
  }
});

test("recordQuotaUsage keeps kinds and days separated", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await recordQuotaUsage(db, {
      kind: "ai",
      day: DAY,
      count: 1,
      costSum: 1,
      now: NOW,
    });
    await recordQuotaUsage(db, {
      kind: "d1",
      day: DAY,
      count: 4,
      costSum: 4,
      now: NOW,
    });
    await recordQuotaUsage(db, {
      kind: "ai",
      day: "2026-01-02",
      count: 9,
      costSum: 9,
      now: NOW,
    });
    assert.equal((await getQuotaUsage(db, "ai", DAY))?.count, 1);
    assert.equal((await getQuotaUsage(db, "d1", DAY))?.costSum, 4);
    assert.equal((await getQuotaUsage(db, "ai", "2026-01-02"))?.count, 9);
    assert.equal(await getQuotaUsage(db, "r2", DAY), undefined);
  } finally {
    close();
  }
});

test("listQuotaUsage returns every kind recorded for the day", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await recordQuotaUsage(db, {
      kind: "r2",
      day: DAY,
      count: 2,
      costSum: 7,
      now: NOW,
    });
    await recordQuotaUsage(db, {
      kind: "ai",
      day: DAY,
      count: 1,
      costSum: 3,
      now: NOW,
    });
    const rows = await listQuotaUsage(db, DAY);
    assert.deepEqual(
      rows.map((row) => row.kind),
      ["ai", "r2"],
    );
    assert.deepEqual(await listQuotaUsage(db, "2026-02-02"), []);
  } finally {
    close();
  }
});
