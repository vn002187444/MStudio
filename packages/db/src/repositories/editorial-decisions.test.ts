import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  addRevision,
  createArticle,
  createEditorialDecision,
  createFeed,
  createRawItem,
  createSource,
  createStory,
  getEditorialDecision,
} from "../index.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";

async function seedRawItem(
  db: D1Database,
  id = "raw-1",
): Promise<string> {
  await createSource(db, {
    id: "source-1",
    name: "Example News",
    originUrl: "https://example.com",
    kind: "rss",
    now: NOW,
  });
  await createFeed(db, {
    id: "feed-1",
    sourceId: "source-1",
    url: "https://example.com/feed.xml",
    format: "rss",
    now: NOW,
  });
  await createRawItem(db, {
    id,
    feedId: "feed-1",
    sourceId: "source-1",
    url: "https://example.com/article-1",
    title: "Article headline",
    fetchedAt: NOW,
    payloadHash: `hash-${id}`,
  });
  return id;
}

async function seedDraftLineage(
  db: D1Database,
): Promise<{ storyId: string; articleId: string; revisionId: string }> {
  await createStory(db, { id: "story-1", title: "Story", now: NOW });
  await createArticle(db, {
    id: "article-1",
    storyId: "story-1",
    now: NOW,
  });
  await addRevision(db, {
    id: "revision-1",
    articleId: "article-1",
    title: "First",
    body: "Body",
    now: NOW,
  });
  return {
    storyId: "story-1",
    articleId: "article-1",
    revisionId: "revision-1",
  };
}

test("createEditorialDecision stores accepted decision with lineage", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItemId = await seedRawItem(db);
    const { storyId, articleId, revisionId } =
      await seedDraftLineage(db);
    const { row, created } = await createEditorialDecision(db, {
      id: "decision-1",
      rawItemId,
      decision: "accepted",
      storyId,
      articleId,
      revisionId,
      draftSource: "ai",
      actor: "editor-1",
      decidedAt: NOW,
      now: NOW,
    });
    assert.equal(created, true);
    assert.equal(row.rawItemId, rawItemId);
    assert.equal(row.decision, "accepted");
    assert.equal(row.storyId, "story-1");
    assert.equal(row.articleId, "article-1");
    assert.equal(row.revisionId, "revision-1");
    assert.equal(row.draftSource, "ai");
    assert.equal(row.actor, "editor-1");
    assert.equal(row.decidedAt, NOW);

    const fetched = await getEditorialDecision(db, rawItemId);
    assert.equal(fetched?.id, "decision-1");
    assert.equal(fetched?.draftSource, "ai");
  } finally {
    close();
  }
});

test("createEditorialDecision is idempotent on raw_item_id", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItemId = await seedRawItem(db);
    const first = await createEditorialDecision(db, {
      id: "decision-1",
      rawItemId,
      decision: "accepted",
      actor: "editor-1",
      now: NOW,
    });
    const second = await createEditorialDecision(db, {
      id: "decision-2",
      rawItemId,
      decision: "accepted",
      actor: "editor-2",
      now: NOW,
    });
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(second.row.id, "decision-1");
    assert.equal(second.row.actor, "editor-1");
  } finally {
    close();
  }
});

test("rejected decision round-trips without lineage", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItemId = await seedRawItem(db);
    const { row } = await createEditorialDecision(db, {
      id: "decision-r",
      rawItemId,
      decision: "rejected",
      actor: "reviewer-1",
      now: NOW,
    });
    assert.equal(row.decision, "rejected");
    assert.equal(row.storyId, undefined);
    assert.equal(row.articleId, undefined);
    assert.equal(row.revisionId, undefined);
    assert.equal(row.draftSource, undefined);
  } finally {
    close();
  }
});

test("getEditorialDecision returns undefined for unknown raw item", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const decision = await getEditorialDecision(db, "missing");
    assert.equal(decision, undefined);
  } finally {
    close();
  }
});
