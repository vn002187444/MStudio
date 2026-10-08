import assert from "node:assert/strict";
import { test } from "node:test";
import { jobError, jobErrorResponse } from "./errors.ts";

test("builds a job error envelope with safe defaults", () => {
  const before = Date.now();
  const envelope = jobError({ code: "FETCH_FAILED", message: "boom" });
  const after = Date.now();

  assert.equal(envelope.attempt, 1);
  assert.equal(envelope.maxAttempts, 1);
  assert.equal(envelope.retryable, false);
  assert.ok(envelope.timestamp);
  const ts = Date.parse(envelope.timestamp);
  assert.ok(ts >= before && ts <= after);
});

test("preserves job context and retryability", () => {
  const envelope = jobError({
    code: "NORMALIZE_FAILED",
    message: "bad payload",
    jobId: "job-1",
    jobType: "normalize",
    attempt: 2,
    maxAttempts: 3,
    retryable: true,
    correlationId: "cid-9",
    cause: new Error("root cause"),
  });

  assert.equal(envelope.jobId, "job-1");
  assert.equal(envelope.jobType, "normalize");
  assert.equal(envelope.attempt, 2);
  assert.equal(envelope.maxAttempts, 3);
  assert.equal(envelope.retryable, true);
  assert.equal(envelope.correlationId, "cid-9");
  assert.equal((envelope.cause as Error).message, "root cause");
});

test("jobErrorResponse renders the envelope as json", async () => {
  const envelope = jobError({ code: "X", message: "y" });
  const response = jobErrorResponse(envelope, 502);
  assert.equal(response.status, 502);
  const body = (await response.json()) as { error: typeof envelope };
  assert.equal(body.error.code, "X");
});
