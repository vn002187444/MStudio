import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";
import { createFeed, createRawItem, createSource } from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { runClusteringStage } from "./index.ts";

const NOW = "2026-01-05T00:00:00.000Z";

function capturingLogger(): Logger {
  const noop = () => {};
  return { debug: noop, info: noop, warn: noop, error: noop };
}

async function seedItem(db: D1Database, id: string): Promise<void> {
  await createSource(db, {
    id: `source-${id}`,
    name: `Source ${id}`,
    originUrl: `https://source-${id}.example.com`,
    kind: "rss",
    now: NOW,
  });
  await createFeed(db, {
    id: `feed-${id}`,
    sourceId: `source-${id}`,
    url: `https://source-${id}.example.com/feed.xml`,
    format: "rss",
    now: NOW,
  });
  await createRawItem(db, {
    id: `item-${id}`,
    feedId: `feed-${id}`,
    sourceId: `source-${id}`,
    url: `https://source-${id}.example.com/${id}`,
    title: `Headline ${id}`,
    fetchedAt: NOW,
    payloadHash: `hash-${id}`,
  });
}

test("QUOTA_MODE=SAFE turns off the embeddings path", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedItem(db, "a");
    const logger = capturingLogger();
    const normal = await runClusteringStage(
      {
        DB: db,
        ENVIRONMENT: "test",
        LOG_LEVEL: "error",
        FEATURE_VECTORIZE_ENABLED: "true",
      } as unknown as Env,
      logger,
    );
    assert.equal(normal.vectorizeEnabled, true);
    const safe = await runClusteringStage(
      {
        DB: db,
        ENVIRONMENT: "test",
        LOG_LEVEL: "error",
        FEATURE_VECTORIZE_ENABLED: "true",
        QUOTA_MODE: "SAFE",
      } as unknown as Env,
      logger,
    );
    assert.equal(safe.itemsScanned, 1);
    assert.equal(safe.vectorizeEnabled, false);
  } finally {
    close();
  }
});
