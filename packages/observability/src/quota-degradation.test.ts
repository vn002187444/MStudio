import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyQuotaDegradation,
  degradationForMode,
  ingestThrottleForMode,
  SAFE_INGEST_INTERVAL_FACTOR,
  STOP_INGEST_INTERVAL_FACTOR,
} from "./quota-degradation.ts";

test("NORMAL and WARN keep everything enabled", () => {
  for (const mode of ["NORMAL", "WARN"] as const) {
    const degradation = degradationForMode(mode);
    assert.equal(degradation.disableEmbeddings, false);
    assert.equal(degradation.disableRecommendationRefresh, false);
    assert.equal(degradation.ingestIntervalFactor, 1);
  }
});

test("SAFE and STOP disable embeddings and recommendation refresh", () => {
  for (const mode of ["SAFE", "STOP"] as const) {
    const degradation = degradationForMode(mode);
    assert.equal(degradation.disableEmbeddings, true);
    assert.equal(degradation.disableRecommendationRefresh, true);
  }
});

test("SAFE and STOP loosen the ingest cadence", () => {
  assert.equal(
    degradationForMode("SAFE").ingestIntervalFactor,
    SAFE_INGEST_INTERVAL_FACTOR,
  );
  assert.equal(
    degradationForMode("STOP").ingestIntervalFactor,
    STOP_INGEST_INTERVAL_FACTOR,
  );
  assert.ok(
    degradationForMode("STOP").ingestIntervalFactor >
      degradationForMode("SAFE").ingestIntervalFactor,
  );
});

test("applyQuotaDegradation forces embeddings and recommendation refresh off", () => {
  const flags = {
    embeddingsEnabled: true,
    recommendationRefreshEnabled: true,
    readerEventsEnabled: true,
  };
  const degraded = applyQuotaDegradation(flags, "SAFE");
  assert.equal(degraded.embeddingsEnabled, false);
  assert.equal(degraded.recommendationRefreshEnabled, false);
  assert.equal(degraded.readerEventsEnabled, true);
  // Input record is untouched.
  assert.equal(flags.embeddingsEnabled, true);
});

test("applyQuotaDegradation is a no-op in NORMAL and WARN", () => {
  const flags = { embeddingsEnabled: true, readerEventsEnabled: true };
  for (const mode of ["NORMAL", "WARN"] as const) {
    assert.deepEqual(applyQuotaDegradation(flags, mode), flags);
  }
});

test("STOP defers the whole ingest run", () => {
  const throttle = ingestThrottleForMode("STOP", 100);
  assert.equal(throttle.skipAll, true);
  assert.equal(throttle.maxFeedsPerRun, undefined);
});

test("SAFE halves the feeds processed per run", () => {
  const throttle = ingestThrottleForMode("SAFE", 100);
  assert.equal(throttle.skipAll, false);
  assert.equal(throttle.maxFeedsPerRun, 50);
});

test("SAFE throttles to at least one feed per run", () => {
  const throttle = ingestThrottleForMode("SAFE", 1);
  assert.equal(throttle.maxFeedsPerRun, 1);
});

test("NORMAL and WARN do not throttle ingest", () => {
  for (const mode of ["NORMAL", "WARN"] as const) {
    const throttle = ingestThrottleForMode(mode, 100);
    assert.equal(throttle.skipAll, false);
    assert.equal(throttle.maxFeedsPerRun, undefined);
  }
});
