import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeQuotaMode,
  effectiveQuotaMode,
  InMemoryQuotaGuard,
  quotaModeFromEnv,
  thresholdsFromEnv,
  worstMode,
  type QuotaThresholds,
} from "./quota-guard.ts";

const thresholds: QuotaThresholds = {
  warn: { modelUsage: 50 },
  safe: { modelUsage: 80 },
  stop: { modelUsage: 100 },
};

test("escalates NORMAL -> WARN -> SAFE -> STOP as usage crosses thresholds", () => {
  const guard = new InMemoryQuotaGuard(thresholds);
  assert.equal(guard.mode(), "NORMAL");

  guard.record({ modelUsage: 50 });
  assert.equal(guard.mode(), "WARN");

  guard.record({ modelUsage: 30 });
  assert.equal(guard.mode(), "SAFE");

  guard.record({ modelUsage: 20 });
  assert.equal(guard.mode(), "STOP");
});

test("STOP mode serves cached content only", () => {
  const guard = new InMemoryQuotaGuard(thresholds);
  guard.record({ modelUsage: 100 });

  assert.equal(guard.canPerform("workersRequests"), true);
  assert.equal(guard.canPerform("d1Reads"), true);
  assert.equal(guard.canPerform("modelUsage"), false);
  assert.equal(guard.canPerform("queueOperations"), false);
  assert.equal(guard.canPerform("vectorizeDimensions"), false);
});

test("SAFE mode blocks expensive metrics but keeps serving and reads", () => {
  const guard = new InMemoryQuotaGuard(thresholds);
  guard.record({ modelUsage: 80 });

  assert.equal(guard.canPerform("workersRequests"), true);
  assert.equal(guard.canPerform("d1Reads"), true);
  assert.equal(guard.canPerform("d1Writes"), true);
  assert.equal(guard.canPerform("modelUsage"), false);
  assert.equal(guard.canPerform("analyticsEvents"), false);
});

test("WARN mode allows everything", () => {
  const guard = new InMemoryQuotaGuard(thresholds);
  guard.record({ modelUsage: 50 });

  assert.equal(guard.canPerform("modelUsage"), true);
  assert.equal(guard.canPerform("queueOperations"), true);
});

test("metrics without thresholds never escalate", () => {
  const guard = new InMemoryQuotaGuard(thresholds);
  guard.record({ d1Reads: 1_000_000 });
  assert.equal(guard.mode(), "NORMAL");
});

test("computeQuotaMode escalates per metric independently", () => {
  const usage = { workersRequests: 10, modelUsage: 10 };
  assert.equal(computeQuotaMode(usage, thresholds), "NORMAL");
  assert.equal(
    computeQuotaMode({ modelUsage: 55 }, thresholds),
    "WARN",
  );
  assert.equal(
    computeQuotaMode({ modelUsage: 85 }, thresholds),
    "SAFE",
  );
  assert.equal(
    computeQuotaMode({ modelUsage: 101 }, thresholds),
    "STOP",
  );
  // A metric crossing STOP wins over another metric at WARN.
  assert.equal(
    computeQuotaMode(
      { modelUsage: 101, workersRequests: 1_000_000 },
      thresholds,
    ),
    "STOP",
  );
});

test("thresholdsFromEnv parses QUOTA_GUARD_ vars per metric", () => {
  const parsed = thresholdsFromEnv({
    QUOTA_GUARD_WARN_MODEL_USAGE: "50",
    QUOTA_GUARD_SAFE_MODEL_USAGE: "80",
    QUOTA_GUARD_STOP_MODEL_USAGE: "100",
    QUOTA_GUARD_STOP_D1_WRITES: "1000",
    QUOTA_GUARD_SAFE_ANALYTICS_EVENTS: "5000",
    QUOTA_GUARD_WARN_WORKERS_REQUESTS: "100000",
  });
  assert.deepEqual(parsed, {
    warn: { modelUsage: 50, workersRequests: 100_000 },
    safe: { modelUsage: 80, analyticsEvents: 5000 },
    stop: { modelUsage: 100, d1Writes: 1000 },
  });
});

test("thresholdsFromEnv starts empty and ignores invalid values", () => {
  assert.deepEqual(thresholdsFromEnv({}), {
    warn: {},
    safe: {},
    stop: {},
  });
  const parsed = thresholdsFromEnv({
    QUOTA_GUARD_STOP_MODEL_USAGE: "not-a-number",
    QUOTA_GUARD_SAFE_D1_READS: "-5",
    QUOTA_GUARD_WARN_R2_OPERATIONS: "",
  });
  assert.deepEqual(parsed, { warn: {}, safe: {}, stop: {} });
});

test("quotaModeFromEnv maps QUOTA_MODE and ignores invalid values", () => {
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "safe" }), "SAFE");
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "STOP" }), "STOP");
  assert.equal(quotaModeFromEnv({}), undefined);
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "CHAOS" }), undefined);
});

test("effectiveQuotaMode takes the worse of computed and override", () => {
  assert.equal(effectiveQuotaMode("WARN", undefined), "WARN");
  assert.equal(effectiveQuotaMode("NORMAL", "SAFE"), "SAFE");
  assert.equal(effectiveQuotaMode("SAFE", "WARN"), "SAFE");
  assert.equal(effectiveQuotaMode("STOP", "NORMAL"), "STOP");
});

test("worstMode ranks modes by severity", () => {
  assert.equal(worstMode("NORMAL", "WARN"), "WARN");
  assert.equal(worstMode("STOP", "NORMAL"), "STOP");
  assert.equal(worstMode("WARN", "WARN"), "WARN");
});
