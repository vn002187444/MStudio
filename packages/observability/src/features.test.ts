import assert from "node:assert/strict";
import { test } from "node:test";
import { createFeatureFlags, flagsFromEnv } from "./features.ts";

test("features default to enabled and can be killed", () => {
  const flags = createFeatureFlags();
  assert.equal(flags.isEnabled("ingestScheduler"), true);

  flags.set("ingestScheduler", false);
  assert.equal(flags.isEnabled("ingestScheduler"), false);
  assert.deepEqual(flags.list(), { ingestScheduler: false });
});

test("initial flags are honored", () => {
  const flags = createFeatureFlags({ vectorize: false });
  assert.equal(flags.isEnabled("vectorize"), false);
  assert.equal(flags.isEnabled("other"), true);
});

test("flagsFromEnv parses FEATURE_ variables", () => {
  const env = {
    FEATURE_INGEST_SCHEDULER: "off",
    FEATURE_VECTORIZE: "false",
    FEATURE_OTHER: "on",
    UNRELATED: "off",
  };
  const flags = flagsFromEnv(env);
  assert.equal(flags.ingestScheduler, false);
  assert.equal(flags.vectorize, false);
  assert.equal(flags.other, true);
  assert.equal(Object.hasOwn(flags, "unrelated"), false);
});
