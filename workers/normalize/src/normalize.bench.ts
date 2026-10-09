import { test } from "node:test";
import { performance } from "node:perf_hooks";
import { openMigratedTestDb } from "../../../packages/db/src/testing/helpers.ts";
import { createFeed } from "../../../packages/db/src/repositories/feeds.ts";
import { createSource } from "../../../packages/db/src/repositories/sources.ts";
import { createRawItem, createRawItems } from "../../../packages/db/src/repositories/raw-items.ts";

async function seedFeed(db: any) {
  const source = await createSource(db, {
    id: "src-bench",
    name: "Source",
    originUrl: "https://source.example.com",
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  const feed = await createFeed(db, {
    id: "feed-bench",
    sourceId: source.id,
    url: "https://source.example.com/feed.xml",
    format: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  return { sourceId: source.id, feedId: feed.id };
}

test("benchmark sequential vs batched raw item inserts", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    const items = [];
    for (let i = 0; i < 50; i++) {
      items.push({
        id: `item-seq-${i}`,
        feedId: feed.feedId,
        sourceId: feed.sourceId,
        externalId: `ext-seq-${i}`,
        url: `https://source.example.com/seq/${i}`,
        canonicalUrl: `https://source.example.com/seq/${i}`,
        title: `Item ${i}`,
        fetchedAt: "2026-01-02T00:00:00.000Z",
        payloadHash: `hash-seq-${i}`,
      });
    }

    const startSeq = performance.now();
    for (const item of items) {
      await createRawItem(db, item);
    }
    const endSeq = performance.now();
    const seqTime = endSeq - startSeq;

    const itemsBatch = [];
    for (let i = 0; i < 50; i++) {
      itemsBatch.push({
        id: `item-batch-${i}`,
        feedId: feed.feedId,
        sourceId: feed.sourceId,
        externalId: `ext-batch-${i}`,
        url: `https://source.example.com/batch/${i}`,
        canonicalUrl: `https://source.example.com/batch/${i}`,
        title: `Item ${i}`,
        fetchedAt: "2026-01-02T00:00:00.000Z",
        payloadHash: `hash-batch-${i}`,
      });
    }

    const startBatch = performance.now();
    await createRawItems(db, itemsBatch);
    const endBatch = performance.now();
    const batchTime = endBatch - startBatch;

    console.log(`Sequential 50 items: ${seqTime.toFixed(2)}ms`);
    console.log(`Batched 50 items: ${batchTime.toFixed(2)}ms`);
    console.log(`Improvement: ${((seqTime - batchTime) / seqTime * 100).toFixed(2)}% faster`);
  } finally {
    close();
  }
});
