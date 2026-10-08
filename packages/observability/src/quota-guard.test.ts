import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InMemoryQuotaGuard,
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
