import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CORRELATION_HEADER,
  getCorrelationId,
  withCorrelationId,
} from "./correlation.ts";

test("generates a uuid correlation id when header is missing", () => {
  const request = new Request("https://example.com/");
  const id = getCorrelationId(request);
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

test("propagates an existing correlation id", () => {
  const request = new Request("https://example.com/", {
    headers: { [CORRELATION_HEADER]: "abc-123" },
  });
  assert.equal(getCorrelationId(request), "abc-123");

  const { request: tagged, correlationId } = withCorrelationId(request);
  assert.equal(correlationId, "abc-123");
  assert.equal(tagged.headers.get(CORRELATION_HEADER), "abc-123");
});
