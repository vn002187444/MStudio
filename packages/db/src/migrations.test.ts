import assert from "node:assert/strict";
import { test } from "node:test";
import { openMigratedTestDb } from "./testing/helpers.ts";

test("migration v1 creates the five core tables", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const tables = (
      await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all<{ name: string }>()
    ).results.map((row) => row.name);
    assert.deepEqual(tables, [
      "feeds",
      "jobs",
      "raw_items",
      "sources",
      "users",
    ]);
  } finally {
    close();
  }
});

test("migration v1 creates the documented hot-query indexes", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const indexes = (
      await db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
        )
        .all<{ name: string }>()
    ).results.map((row) => row.name);
    assert.deepEqual(indexes, [
      "idx_jobs_correlation_id",
      "idx_jobs_status_type",
      "idx_raw_items_canonical",
      "idx_raw_items_feed_fetched",
      "idx_raw_items_payload_hash",
      "idx_raw_items_status_created",
    ]);
  } finally {
    close();
  }
});

test("migration v1 enforces ingest idempotency constraint", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await db
      .prepare(
        "INSERT INTO sources (id, name, origin_url, kind, created_at, updated_at) VALUES ('s1', 'n', 'u', 'rss', 't', 't')",
      )
      .run();
    await db
      .prepare(
        "INSERT INTO feeds (id, source_id, url, format, created_at, updated_at) VALUES ('f1', 's1', 'https://example.com/feed', 'rss', 't', 't')",
      )
      .run();
    const insertItem = () =>
      db
        .prepare(
          "INSERT INTO raw_items (id, feed_id, source_id, external_id, url, fetched_at, payload_hash, created_at) VALUES (?, 'f1', 's1', 'ext-1', 'https://example.com/1', 't', 'h', 't')",
        )
        .bind(crypto.randomUUID())
        .run();
    await insertItem();
    await assert.rejects(insertItem());
  } finally {
    close();
  }
});
