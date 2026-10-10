import assert from "node:assert/strict";
import { test } from "node:test";
import { openMigratedTestDb } from "./testing/helpers.ts";

test("migrations create the core and story domain tables", async () => {
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
      "agent_runs",
      "article_revisions",
      "articles",
      "audit_log",
      "categories",
      "claims",
      "entities",
      "facts",
      "feeds",
      "jobs",
      "rate_limits",
      "raw_items",
      "reader_events",
      "reader_profiles",
      "sessions",
      "sources",
      "stories",
      "story_entities",
      "story_sources",
      "users",
    ]);
  } finally {
    close();
  }
});

test("migrations create the documented hot-query indexes", async () => {
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
      "idx_agent_runs_status",
      "idx_agent_runs_story",
      "idx_article_revisions_article",
      "idx_articles_story_status",
      "idx_claims_story_status",
      "idx_entities_normalized",
      "idx_facts_story",
      "idx_feeds_enabled_created",
      "idx_jobs_correlation_id",
      "idx_jobs_status_type",
      "idx_raw_items_canonical",
      "idx_raw_items_feed_fetched",
      "idx_raw_items_payload_hash",
      "idx_raw_items_status_created",
      "idx_reader_events_article",
      "idx_reader_events_user",
      "idx_story_entities_entity",
      "idx_story_sources_story",
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
