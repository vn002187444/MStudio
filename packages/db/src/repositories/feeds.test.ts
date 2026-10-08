import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFeed,
  getFeed,
  listEnabledFeeds,
  listFeedsBySource,
  setFeedEnabled,
  updateFeedFetchResult,
} from "./feeds.ts";
import { createSource } from "./sources.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

async function seedSource(
  db: Parameters<typeof createSource>[0],
  id: string,
) {
  return createSource(db, {
    id,
    name: `Source ${id}`,
    originUrl: `https://${id}.example.com`,
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
}

test("creates and reads a feed", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    const feed = await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://source-1.example.com/feed.xml",
      format: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    assert.equal(feed.sourceId, "src-1");
    assert.equal(feed.enabled, true);
    assert.equal(feed.fetchIntervalSeconds, 900);
    const read = await getFeed(db, "feed-1");
    assert.deepEqual(read, feed);
  } finally {
    close();
  }
});

test("enforces one feed per url within a source", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://source-1.example.com/feed.xml",
      format: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    await assert.rejects(
      createFeed(db, {
        id: "feed-2",
        sourceId: "src-1",
        url: "https://source-1.example.com/feed.xml",
        format: "atom",
        now: "2026-01-01T00:00:00.000Z",
      }),
    );
  } finally {
    close();
  }
});

test("enables and disables a feed", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://source-1.example.com/feed.xml",
      format: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    const disabled = await setFeedEnabled(db, "feed-1", false);
    assert.equal(disabled?.enabled, false);
    const enabled = await setFeedEnabled(db, "feed-1", true);
    assert.equal(enabled?.enabled, true);
    assert.equal(await setFeedEnabled(db, "missing", true), undefined);
  } finally {
    close();
  }
});

test("records feed fetch results", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://source-1.example.com/feed.xml",
      format: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
    const ok = await updateFeedFetchResult(db, "feed-1", {
      fetchedAt: "2026-01-02T00:00:00.000Z",
    });
    assert.equal(ok?.lastFetchedAt, "2026-01-02T00:00:00.000Z");
    assert.equal(ok?.lastError, undefined);
    const failed = await updateFeedFetchResult(db, "feed-1", {
      fetchedAt: "2026-01-03T00:00:00.000Z",
      error: "ETIMEDOUT",
    });
    assert.equal(failed?.lastError, "ETIMEDOUT");
  } finally {
    close();
  }
});

test("lists enabled feeds only", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://source-1.example.com/1.xml",
      format: "rss",
      now: "2026-01-01T00:00:01.000Z",
    });
    await createFeed(db, {
      id: "feed-2",
      sourceId: "src-1",
      url: "https://source-1.example.com/2.xml",
      format: "rss",
      now: "2026-01-01T00:00:02.000Z",
    });
    await setFeedEnabled(db, "feed-2", false);
    const enabled = await listEnabledFeeds(db);
    assert.equal(enabled.rows.length, 1);
    assert.equal(enabled.rows[0].id, "feed-1");
  } finally {
    close();
  }
});

test("lists feeds by source with pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedSource(db, "src-1");
    await seedSource(db, "src-2");
    const stamps = [
      "2026-01-01T00:00:01.000Z",
      "2026-01-01T00:00:02.000Z",
      "2026-01-01T00:00:03.000Z",
    ];
    for (const [index, now] of stamps.entries()) {
      await createFeed(db, {
        id: `feed-${index + 1}`,
        sourceId: "src-1",
        url: `https://source-1.example.com/${index + 1}.xml`,
        format: "rss",
        now,
      });
    }
    await createFeed(db, {
      id: "feed-other",
      sourceId: "src-2",
      url: "https://source-2.example.com/1.xml",
      format: "rss",
      now: "2026-01-01T00:00:04.000Z",
    });
    const page1 = await listFeedsBySource(db, "src-1", { limit: 2 });
    assert.equal(page1.rows.length, 2);
    assert.ok(page1.nextCursor);
    const page2 = await listFeedsBySource(db, "src-1", {
      limit: 2,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});
