import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addRevision,
  addStorySource,
  createArticle,
  createFeed,
  createRawItem,
  createSource,
  createStory,
  getArticle,
  getPublishedArticle,
  listArticlesByStatus,
  listPublishedArticles,
  listRevisions,
  publishArticle,
  PublishConflictError,
  transitionArticle,
  TransitionError,
  updateArticleMetadata,
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

test("getPublishedArticle resolves source lineage via story_sources", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    // Chain: source -> feed -> raw_item -> story_source -> story -> article
    await createSource(db, {
      id: "src-1",
      name: "Example News",
      originUrl: "https://example.news",
      kind: "rss",
      rightsStatus: "clear",
      now: NOW,
    });
    await createFeed(db, {
      id: "feed-1",
      sourceId: "src-1",
      url: "https://example.news/rss",
      format: "rss",
      now: NOW,
    });
    await createRawItem(db, {
      id: "raw-1",
      feedId: "feed-1",
      sourceId: "src-1",
      url: "https://example.news/a",
      fetchedAt: NOW,
      payloadHash: "hash-1",
    });
    await createStory(db, { id: "story-src", title: "Story", now: NOW });
    await addStorySource(db, {
      id: "ss-1",
      storyId: "story-src",
      rawItemId: "raw-1",
      role: "primary",
      now: NOW,
    });
    await createArticle(db, { id: "a-src", storyId: "story-src", now: NOW });
    await addRevision(db, {
      id: "r-src",
      articleId: "a-src",
      title: "Title",
      body: "Body",
      now: NOW,
    });
    for (const status of ["ai_qa", "auto_eligible", "scheduled"] as const) {
      await transitionArticle(db, "a-src", status, NOW);
    }
    await publishArticle(db, "a-src", "r-src", NOW);

    const detail = await getPublishedArticle(db, "a-src");
    assert.ok(detail);
    assert.equal(detail.sources.length, 1);
    assert.deepEqual(detail.sources[0], {
      name: "Example News",
      originUrl: "https://example.news",
      rightsStatus: "clear",
      role: "primary",
    });
    // Draft/unpublished article vẫn undefined (không leak lineage).
    await createArticle(db, { id: "a-draft", storyId: "story-src", now: NOW });
    assert.equal(await getPublishedArticle(db, "a-draft"), undefined);
  } finally {
    close();
  }
});

test("updateArticleMetadata updates SEO, media, and taxonomy fields", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const articleId = await seedArticle(db);
    const updated = await updateArticleMetadata(db, articleId, {
      slug: "test-slug-article",
      categorySlug: "cong-nghe",
      heroImageUrl: "https://example.com/hero.jpg",
      videoUrl: "https://example.com/video.mp4",
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
      canonicalUrl: "https://example.com/canonical",
      ogImageUrl: "https://example.com/og.jpg",
      keywords: "ai, technology",
      sourceCount: 3,
      qualityScore: 9.5,
      isBreaking: true,
      isTrending: true,
    });

    assert.equal(updated.slug, "test-slug-article");
    assert.equal(updated.categorySlug, "cong-nghe");
    assert.equal(updated.heroImageUrl, "https://example.com/hero.jpg");
    assert.equal(updated.videoUrl, "https://example.com/video.mp4");
    assert.equal(updated.metaTitle, "SEO Title");
    assert.equal(updated.metaDescription, "SEO Description");
    assert.equal(updated.canonicalUrl, "https://example.com/canonical");
    assert.equal(updated.ogImageUrl, "https://example.com/og.jpg");
    assert.equal(updated.keywords, "ai, technology");
    assert.equal(updated.sourceCount, 3);
    assert.equal(updated.qualityScore, 9.5);
    assert.equal(updated.isBreaking, true);
    assert.equal(updated.isTrending, true);

    const fetched = await getArticle(db, articleId);
    assert.equal(fetched?.slug, "test-slug-article");
    assert.equal(fetched?.isBreaking, true);
    assert.equal(fetched?.isTrending, true);
  } finally {
    close();
  }
});

test("getPublishedArticle resolves by slug and returns metadata", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createStory(db, { id: "story-pub", title: "Story Pub", now: NOW });
    await createArticle(db, {
      id: "art-pub",
      storyId: "story-pub",
      slug: "bai-viet-slug-chuan",
      categorySlug: "kinh-doanh",
      heroImageUrl: "https://example.com/art.jpg",
      isBreaking: true,
      now: NOW,
    });
    await addRevision(db, {
      id: "rev-pub",
      articleId: "art-pub",
      title: "Public Title",
      body: "Public Body",
      now: NOW,
    });
    for (const status of ["ai_qa", "auto_eligible", "scheduled"] as const) {
      await transitionArticle(db, "art-pub", status, NOW);
    }
    await publishArticle(db, "art-pub", "rev-pub", NOW);

    // Tìm kiếm bằng id
    const byId = await getPublishedArticle(db, "art-pub");
    assert.ok(byId);
    assert.equal(byId.slug, "bai-viet-slug-chuan");
    assert.equal(byId.heroImageUrl, "https://example.com/art.jpg");
    assert.equal(byId.isBreaking, true);

    // Tìm kiếm bằng slug
    const bySlug = await getPublishedArticle(db, "bai-viet-slug-chuan");
    assert.ok(bySlug);
    assert.equal(bySlug.id, "art-pub");
    assert.equal(bySlug.title, "Public Title");
  } finally {
    close();
  }
});

test("listPublishedArticles filters by categorySlug and preserves keyset cursor on updatedAt", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createStory(db, { id: "story-cat", title: "Story Cat", now: NOW });
    
    // Bài 1: kinh-doanh, published lúc NOW
    await createArticle(db, {
      id: "art-cat-1",
      storyId: "story-cat",
      categorySlug: "kinh-doanh",
      now: NOW,
    });
    await addRevision(db, {
      id: "rev-cat-1",
      articleId: "art-cat-1",
      title: "Kinh doanh 1",
      body: "Body",
      now: NOW,
    });
    for (const status of ["ai_qa", "auto_eligible", "scheduled"] as const) {
      await transitionArticle(db, "art-cat-1", status, NOW);
    }
    await publishArticle(db, "art-cat-1", "rev-cat-1", NOW);

    // Bài 2: cong-nghe, published lúc LATER
    await createArticle(db, {
      id: "art-cat-2",
      storyId: "story-cat",
      categorySlug: "cong-nghe",
      now: NOW,
    });
    await addRevision(db, {
      id: "rev-cat-2",
      articleId: "art-cat-2",
      title: "Cong nghe 1",
      body: "Body",
      now: NOW,
    });
    for (const status of ["ai_qa", "auto_eligible", "scheduled"] as const) {
      await transitionArticle(db, "art-cat-2", status, NOW);
    }
    await publishArticle(db, "art-cat-2", "rev-cat-2", LATER);

    // Lọc chuyên mục kinh-doanh
    const kdList = await listPublishedArticles(db, { categorySlug: "kinh-doanh" });
    assert.equal(kdList.rows.length, 1);
    assert.equal(kdList.rows[0].id, "art-cat-1");

    // Lọc chuyên mục cong-nghe
    const cnList = await listPublishedArticles(db, { categorySlug: "cong-nghe" });
    assert.equal(cnList.rows.length, 1);
    assert.equal(cnList.rows[0].id, "art-cat-2");

    // Keyset cursor test: limit = 1
    const p1 = await listPublishedArticles(db, { limit: 1 });
    assert.equal(p1.rows.length, 1);
    assert.equal(p1.rows[0].id, "art-cat-2");
    assert.ok(p1.nextCursor);
    // nextCursor.createdAt phải mang updatedAt của art-cat-2 (LATER)
    assert.equal(p1.nextCursor.createdAt, LATER);
  } finally {
    close();
  }
});

