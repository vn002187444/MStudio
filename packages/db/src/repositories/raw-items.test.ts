import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countRawItemsByStatus,
  createRawItem,
  listRawItemsByFeed,
  listRawItemsByStatus,
  setRawItemStatus,
} from "./raw-items.ts";
import { createFeed } from "./feeds.ts";
import { createSource } from "./sources.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

async function seedFeed(
  db: Parameters<typeof createSource>[0],
): Promise<{ sourceId: string; feedId: string }> {
  const source = await createSource(db, {
    id: "src-1",
    name: "Source",
    originUrl: "https://source.example.com",
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  const feed = await createFeed(db, {
    id: "feed-1",
    sourceId: source.id,
    url: "https://source.example.com/feed.xml",
    format: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  return { sourceId: source.id, feedId: feed.id };
}

function item(
  feed: { sourceId: string; feedId: string },
  index: number,
) {
  return {
    id: `item-${index}`,
    feedId: feed.feedId,
    sourceId: feed.sourceId,
    externalId: `ext-${index}`,
    url: `https://source.example.com/${index}`,
    canonicalUrl: `https://source.example.com/${index}`,
    title: `Item ${index}`,
    fetchedAt: "2026-01-02T00:00:00.000Z",
    payloadHash: `hash-${index}`,
  };
}

test("creates a raw item", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    const { row, created } = await createRawItem(db, item(feed, 1));
    assert.equal(created, true);
    assert.equal(row.id, "item-1");
    assert.equal(row.status, "incoming");
    assert.equal(row.externalId, "ext-1");
  } finally {
    close();
  }
});

test("duplicate external id does not duplicate the row", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    const first = await createRawItem(db, item(feed, 1));
    assert.equal(first.created, true);
    const second = await createRawItem(db, {
      ...item(feed, 1),
      id: "different-id",
    });
    assert.equal(second.created, false);
    assert.equal(second.row.id, first.row.id);
    const all = await listRawItemsByFeed(db, feed.feedId);
    assert.equal(all.rows.length, 1);
  } finally {
    close();
  }
});

test("dedupes by payload hash when external id is absent", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    const base = { ...item(feed, 1), externalId: undefined };
    const first = await createRawItem(db, base);
    assert.equal(first.created, true);
    const second = await createRawItem(db, { ...base, id: "other-id" });
    assert.equal(second.created, false);
    assert.equal(second.row.id, first.row.id);
  } finally {
    close();
  }
});

test("lists raw items by feed with pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    const stamps = [
      "2026-01-02T00:00:01.000Z",
      "2026-01-02T00:00:02.000Z",
      "2026-01-02T00:00:03.000Z",
    ];
    for (const [index, now] of stamps.entries()) {
      await createRawItem(db, { ...item(feed, index + 1), fetchedAt: now });
    }
    const page1 = await listRawItemsByFeed(db, feed.feedId, { limit: 2 });
    assert.equal(page1.rows.length, 2);
    assert.ok(page1.nextCursor);
    const page2 = await listRawItemsByFeed(db, feed.feedId, {
      limit: 2,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});

test("lists and counts raw items by status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    await createRawItem(db, item(feed, 1));
    await createRawItem(db, item(feed, 2));
    const incoming = await listRawItemsByStatus(db, "incoming");
    assert.equal(incoming.rows.length, 2);
    assert.equal(await countRawItemsByStatus(db, "incoming"), 2);
    assert.equal(await countRawItemsByStatus(db, "normalized"), 0);
  } finally {
    close();
  }
});

test("transitions raw item status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const feed = await seedFeed(db);
    await createRawItem(db, item(feed, 1));
    const normalized = await setRawItemStatus(db, "item-1", "normalized");
    assert.equal(normalized?.status, "normalized");
    assert.equal(await setRawItemStatus(db, "missing", "clustered"), undefined);
  } finally {
    close();
  }
});
