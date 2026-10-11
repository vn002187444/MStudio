import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addRevision,
  createArticle,
  createStory,
  getArticle,
  listArticlesByStatus,
  listPublishedArticles,
  listRevisions,
  publishArticle,
  PublishConflictError,
  transitionArticle,
  TransitionError,
} from "../index.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-01-01T00:00:01.000Z";

async function seedArticle(
  db: Parameters<typeof createStory>[0],
  status: Parameters<typeof createArticle>[1]["status"] = "drafted",
): Promise<string> {
  await createStory(db, {
    id: "story-1",
    title: "Story",
    now: NOW,
  });
  const article = await createArticle(db, {
    id: "article-1",
    storyId: "story-1",
    status,
    now: NOW,
  });
  return article.id;
}

test("createArticle defaults to drafted", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    const article = await getArticle(db, articleId);
    assert.equal(article?.status, "drafted");
    assert.equal(article?.currentRevisionId, undefined);
    assert.equal(article?.publishedRevisionId, undefined);
  } finally {
    close();
  }
});

test("revision history increments and tracks current revision", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    const rev1 = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "First",
      body: "Body one",
      now: NOW,
    });
    assert.equal(rev1.revisionNumber, 1);
    const rev2 = await addRevision(db, {
      id: "rev-2",
      articleId,
      title: "Second",
      body: "Body two",
      now: LATER,
    });
    assert.equal(rev2.revisionNumber, 2);
    const history = await listRevisions(db, articleId);
    assert.equal(history.length, 2);
    assert.deepEqual(
      history.map((revision) => revision.revisionNumber),
      [1, 2],
    );
    const article = await getArticle(db, articleId);
    assert.equal(article?.currentRevisionId, "rev-2");
  } finally {
    close();
  }
});

test("valid transitions advance status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    const afterQa = await transitionArticle(
      db,
      articleId,
      "ai_qa",
      LATER,
    );
    assert.equal(afterQa.status, "ai_qa");
    const afterReview = await transitionArticle(
      db,
      articleId,
      "human_review",
      LATER,
    );
    assert.equal(afterReview.status, "human_review");
    const scheduled = await transitionArticle(
      db,
      articleId,
      "scheduled",
      LATER,
    );
    assert.equal(scheduled.status, "scheduled");
  } finally {
    close();
  }
});

test("invalid transition throws with allowed targets", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    await assert.rejects(
      transitionArticle(db, articleId, "published", LATER),
      (error: unknown) => {
        assert.ok(error instanceof TransitionError);
        assert.equal(error.from, "drafted");
        assert.equal(error.to, "published");
        assert.deepEqual(error.allowed, ["ai_qa"]);
        return true;
      },
    );
  } finally {
    close();
  }
});

test("review gate: publish requires scheduled status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    const rev = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "Draft",
      body: "Body",
      now: NOW,
    });
    await assert.rejects(
      publishArticle(db, articleId, rev.id, LATER),
      (error: unknown) => {
        assert.ok(error instanceof TransitionError);
        assert.equal(error.to, "published");
        return true;
      },
    );
    const stillDraft = await getArticle(db, articleId);
    assert.equal(stillDraft?.status, "drafted");
    assert.equal(stillDraft?.publishedRevisionId, undefined);
  } finally {
    close();
  }
});

test("publish is idempotent for the same revision", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db, "scheduled");
    const rev = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "Ready",
      body: "Body",
      now: NOW,
    });
    const first = await publishArticle(db, articleId, rev.id, LATER);
    assert.equal(first.alreadyPublished, false);
    assert.equal(first.article.status, "published");
    assert.equal(first.article.publishedRevisionId, "rev-1");
    const second = await publishArticle(db, articleId, rev.id, LATER);
    assert.equal(second.alreadyPublished, true);
    assert.equal(second.article.status, "published");
    const article = await getArticle(db, articleId);
    assert.equal(article?.publishKey, `${articleId}:rev-1`);
  } finally {
    close();
  }
});

test("publishing a different revision after publish conflicts", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db, "scheduled");
    const rev1 = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "One",
      body: "Body",
      now: NOW,
    });
    await publishArticle(db, articleId, rev1.id, LATER);
    const rev2 = await addRevision(db, {
      id: "rev-2",
      articleId,
      title: "Two",
      body: "Body",
      now: LATER,
    });
    await assert.rejects(
      publishArticle(db, articleId, rev2.id, LATER),
      PublishConflictError,
    );
  } finally {
    close();
  }
});

test("publish rejects revision from another article", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db, "scheduled");
    await createStory(db, { id: "story-2", title: "Other", now: NOW });
    const other = await createArticle(db, {
      id: "article-2",
      storyId: "story-2",
      now: NOW,
    });
    const foreignRev = await addRevision(db, {
      id: "rev-foreign",
      articleId: other.id,
      title: "Foreign",
      body: "Body",
      now: NOW,
    });
    await assert.rejects(
      publishArticle(db, articleId, foreignRev.id, LATER),
      /does not belong/,
    );
  } finally {
    close();
  }
});

test("correction states advance after publish", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db, "scheduled");
    const rev = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "Ready",
      body: "Body",
      now: NOW,
    });
    await publishArticle(db, articleId, rev.id, LATER);
    const corrected = await transitionArticle(
      db,
      articleId,
      "corrected",
      LATER,
    );
    assert.equal(corrected.status, "corrected");
    assert.equal(corrected.publishedRevisionId, "rev-1");
    const retracted = await transitionArticle(
      db,
      articleId,
      "retracted",
      LATER,
    );
    assert.equal(retracted.status, "retracted");
    await assert.rejects(
      transitionArticle(db, articleId, "published", LATER),
      TransitionError,
    );
  } finally {
    close();
  }
});

test("retraction is terminal", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db, "scheduled");
    const rev = await addRevision(db, {
      id: "rev-1",
      articleId,
      title: "Ready",
      body: "Body",
      now: NOW,
    });
    await publishArticle(db, articleId, rev.id, LATER);
    await transitionArticle(db, articleId, "retracted", LATER);
    await assert.rejects(
      transitionArticle(db, articleId, "updated", LATER),
      TransitionError,
    );
    const article = await getArticle(db, articleId);
    assert.equal(article?.status, "retracted");
  } finally {
    close();
  }
});

test("listPublishedArticles returns newest first with keyset pagination", async () => {  const { db, close } = await openMigratedTestDb();
  try {
    await createStory(db, { id: "story-1", title: "Story", now: NOW });
    const seeds = [
      { articleId: "a1", revId: "r1", title: "First", at: NOW },
      { articleId: "a2", revId: "r2", title: "Second", at: LATER },
    ];
    for (const seed of seeds) {
      await createArticle(db, {
        id: seed.articleId,
        storyId: "story-1",
        now: seed.at,
      });
      await addRevision(db, {
        id: seed.revId,
        articleId: seed.articleId,
        title: seed.title,
        body: "Body",
        now: seed.at,
      });
      for (const status of ["ai_qa", "auto_eligible", "scheduled"] as const) {
        await transitionArticle(db, seed.articleId, status, seed.at);
      }
      await publishArticle(db, seed.articleId, seed.revId, seed.at);
    }
    await createArticle(db, { id: "a3", storyId: "story-1", now: LATER });
    const page1 = await listPublishedArticles(db, { limit: 1 });
    assert.equal(page1.rows.length, 1);
    assert.equal(page1.rows[0].title, "Second");
    assert.ok(page1.nextCursor);
    const page2 = await listPublishedArticles(db, {
      limit: 1,
      cursor: page1.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.rows[0].title, "First");
    assert.equal(page2.nextCursor, undefined);
  } finally {
    close();
  }
});

test("listArticlesByStatus filters the editorial queue oldest first", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createStory(db, { id: "story-q", title: "Queue", now: NOW });
    await createArticle(db, {
      id: "draft-old",
      storyId: "story-q",
      status: "drafted",
      now: NOW,
    });
    await createArticle(db, {
      id: "draft-new",
      storyId: "story-q",
      status: "drafted",
      now: LATER,
    });
    await createArticle(db, {
      id: "review-1",
      storyId: "story-q",
      status: "human_review",
      now: NOW,
    });
    const drafts = await listArticlesByStatus(db, "drafted", { limit: 1 });
    assert.equal(drafts.rows.length, 1);
    assert.equal(drafts.rows[0].id, "draft-old");
    assert.ok(drafts.nextCursor);
    const page2 = await listArticlesByStatus(db, "drafted", {
      limit: 1,
      cursor: drafts.nextCursor,
    });
    assert.equal(page2.rows.length, 1);
    assert.equal(page2.rows[0].id, "draft-new");
    const reviews = await listArticlesByStatus(db, "human_review");
    assert.equal(reviews.rows.length, 1);
    assert.equal(reviews.rows[0].id, "review-1");
  } finally {
    close();
  }
});
