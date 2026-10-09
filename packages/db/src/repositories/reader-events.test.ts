import assert from "node:assert/strict";
import { test } from "node:test";
import type { NewReaderEvent } from "@mstudio/contracts";
import {
  createReaderEvents,
  getReaderProfile,
  listReaderEventsByArticle,
  listReaderEventsByUser,
  upsertReaderProfile,
} from "../index.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";

function event(
  id: string,
  overrides: Partial<NewReaderEvent> = {},
): NewReaderEvent {
  return {
    id,
    eventType: "open_article",
    articleId: `article-${id}`,
    occurredAt: NOW,
    createdAt: NOW,
    ...overrides,
  };
}

test("createReaderEvents batch-inserts events", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createReaderEvents(db, [
      event("e1"),
      event("e2", { eventType: "meaningful_read", userId: "u1" }),
      event("e3", {
        eventType: "follow_topic",
        topicId: "t1",
        userId: "u1",
      }),
    ]);
    const articlePage = await listReaderEventsByArticle(db, "article-e1");
    assert.equal(articlePage.rows.length, 1);
    assert.equal(articlePage.rows[0].id, "e1");
    assert.equal(articlePage.rows[0].eventType, "open_article");
    const userPage = await listReaderEventsByUser(db, "u1");
    assert.equal(userPage.rows.length, 2);
  } finally {
    close();
  }
});

test("createReaderEvents with an empty list is a no-op", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createReaderEvents(db, []);
    const page = await listReaderEventsByUser(db, "u1");
    assert.equal(page.rows.length, 0);
  } finally {
    close();
  }
});

test("listReaderEventsByArticle paginates with a keyset cursor", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createReaderEvents(db, [
      event("e1", {
        articleId: "a",
        createdAt: "2026-01-01T00:00:01.000Z",
      }),
      event("e2", {
        articleId: "a",
        createdAt: "2026-01-01T00:00:02.000Z",
      }),
      event("e3", {
        articleId: "a",
        createdAt: "2026-01-01T00:00:03.000Z",
      }),
    ]);
    const first = await listReaderEventsByArticle(db, "a", { limit: 2 });
    assert.deepEqual(
      first.rows.map((row) => row.id),
      ["e1", "e2"],
    );
    assert.ok(first.nextCursor);
    const second = await listReaderEventsByArticle(db, "a", {
      limit: 2,
      cursor: first.nextCursor,
    });
    assert.equal(second.rows.length, 1);
    assert.equal(second.rows[0].id, "e3");
    assert.equal(second.nextCursor, undefined);
  } finally {
    close();
  }
});

test("getReaderProfile returns undefined before the first update", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    assert.equal(await getReaderProfile(db, "u1"), undefined);
  } finally {
    close();
  }
});

test("upsertReaderProfile creates then merges topic lists", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const created = await upsertReaderProfile(
      db,
      "u1",
      { followedTopicIds: ["t1"] },
      NOW,
    );
    assert.deepEqual(created.followedTopicIds, ["t1"]);
    assert.deepEqual(created.hiddenTopicIds, []);
    const merged = await upsertReaderProfile(
      db,
      "u1",
      { followedTopicIds: ["t1", "t2"], hiddenTopicIds: ["t3"] },
      NOW,
    );
    assert.deepEqual(merged.followedTopicIds, ["t1", "t2"]);
    assert.deepEqual(merged.hiddenTopicIds, ["t3"]);
    const stored = await getReaderProfile(db, "u1");
    assert.deepEqual(stored?.followedTopicIds, ["t1", "t2"]);
    assert.deepEqual(stored?.hiddenTopicIds, ["t3"]);
  } finally {
    close();
  }
});
