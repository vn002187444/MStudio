import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateCreateSource,
  validateCreateFeed,
  validateUpdateSourceAllowStatus,
  validateUpdateFeed,
  validatePagination,
  validateRawItemStatus,
} from "./validate.ts";

test("validateCreateSource", () => {
  const valid = validateCreateSource({
    name: "My Source",
    originUrl: "https://example.com",
    kind: "rss",
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.name, "My Source");
    assert.equal(valid.value.originUrl, "https://example.com");
    assert.equal(valid.value.kind, "rss");
  }

  const withOptional = validateCreateSource({
    name: "My Source 2",
    originUrl: "http://example.com/2",
    kind: "api",
    rightsStatus: "licensed",
    allowStatus: "approved",
  });
  assert.equal(withOptional.ok, true);
  if (withOptional.ok) {
    assert.equal(withOptional.value.rightsStatus, "licensed");
    assert.equal(withOptional.value.allowStatus, "approved");
  }

  const notObj = validateCreateSource("string");
  assert.equal(notObj.ok, false);
  if (!notObj.ok) {
    assert.deepEqual(notObj.errors, { body: ["expected a JSON object"] });
  }

  const missing = validateCreateSource({});
  assert.equal(missing.ok, false);
  if (!missing.ok) {
    assert.ok(missing.errors.name);
    assert.ok(missing.errors.originUrl);
    assert.ok(missing.errors.kind);
  }

  const invalidTypes = validateCreateSource({
    name: "",
    originUrl: "not-a-url",
    kind: "unknown-kind",
    rightsStatus: "invalid-status",
    allowStatus: "invalid-status",
  });
  assert.equal(invalidTypes.ok, false);
  if (!invalidTypes.ok) {
    assert.ok(invalidTypes.errors.name);
    assert.ok(invalidTypes.errors.originUrl);
    assert.ok(invalidTypes.errors.kind);
    assert.ok(invalidTypes.errors.rightsStatus);
    assert.ok(invalidTypes.errors.allowStatus);
  }

  const nameTooLong = validateCreateSource({
    name: "a".repeat(201),
    originUrl: "https://example.com",
    kind: "rss",
  });
  assert.equal(nameTooLong.ok, false);
  if (!nameTooLong.ok) {
    assert.ok(nameTooLong.errors.name);
  }
});

test("validateCreateFeed", () => {
  const valid = validateCreateFeed({
    url: "https://example.com/feed.xml",
    format: "rss",
  });
  assert.equal(valid.ok, true);

  const withOptional = validateCreateFeed({
    url: "https://example.com/feed.xml",
    format: "atom",
    fetchIntervalSeconds: 3600,
  });
  assert.equal(withOptional.ok, true);

  const invalid = validateCreateFeed({
    url: "ftp://example.com",
    format: "unknown-format",
    fetchIntervalSeconds: 10,
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) {
    assert.ok(invalid.errors.url);
    assert.ok(invalid.errors.format);
    assert.ok(invalid.errors.fetchIntervalSeconds);
  }

  const invalidType = validateCreateFeed("string");
  assert.equal(invalidType.ok, false);
});

test("validateUpdateSourceAllowStatus", () => {
  const valid = validateUpdateSourceAllowStatus({ allowStatus: "approved" });
  assert.equal(valid.ok, true);

  const invalid = validateUpdateSourceAllowStatus({ allowStatus: "unknown" });
  assert.equal(invalid.ok, false);

  const notObj = validateUpdateSourceAllowStatus(null);
  assert.equal(notObj.ok, false);
});

test("validateUpdateFeed", () => {
  const valid = validateUpdateFeed({ enabled: false });
  assert.equal(valid.ok, true);

  const invalid = validateUpdateFeed({ enabled: "true" });
  assert.equal(invalid.ok, false);

  const notObj = validateUpdateFeed(123);
  assert.equal(notObj.ok, false);
});

test("validatePagination", () => {
  const empty = validatePagination(new URLSearchParams());
  assert.equal(empty.ok, true);

  const valid = validatePagination(
    new URLSearchParams("limit=50&cursor_created_at=2023-01-01T00:00:00Z&cursor_id=123")
  );
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.limit, 50);
    assert.deepEqual(valid.value.cursor, {
      createdAt: "2023-01-01T00:00:00Z",
      id: "123",
    });
  }

  const invalidLimit = validatePagination(new URLSearchParams("limit=101"));
  assert.equal(invalidLimit.ok, false);

  const invalidCursor = validatePagination(new URLSearchParams("cursor_created_at=2023-01-01T00:00:00Z"));
  assert.equal(invalidCursor.ok, false);
});

test("validateRawItemStatus", () => {
  const defaultStatus = validateRawItemStatus(null);
  assert.equal(defaultStatus.ok, true);
  if (defaultStatus.ok) {
    assert.equal(defaultStatus.value, "incoming");
  }

  const valid = validateRawItemStatus("normalized");
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value, "normalized");
  }

  const invalid = validateRawItemStatus("unknown");
  assert.equal(invalid.ok, false);
});
