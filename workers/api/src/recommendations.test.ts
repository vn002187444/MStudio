import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  addRevision,
  addStoryEntity,
  addStorySource,
  createArticle,
  createEntity,
  createFeed,
  createRawItem,
  createReaderEvents,
  createSource,
  createStory,
  publishArticle,
  transitionArticle,
  upsertReaderProfile,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import {
  buildRecommendations,
  MAX_ARTICLES_PER_SOURCE,
  type RecommendationCandidate,
} from "./recommendations.ts";

const TOPIC_TECH = "topic-tech";
const TOPIC_SPORT = "topic-sport";
const TOPIC_AI = "topic-ai";
const TRENDING_SINCE = "2026-01-03T00:00:00.000Z";

interface Fixture {
  db: D1Database;
  close(): void;
}

async function seedFixture(): Promise<Fixture> {
  const { db, close } = await openMigratedTestDb();
  const now = (minute: number) =>
    `2026-01-02T00:${String(minute).padStart(2, "0")}:00.000Z`;

  await createSource(db, {
    id: "src-a",
    name: "Source A",
    originUrl: "https://a.example.com",
    kind: "rss",
    now: now(0),
  });
  await createSource(db, {
    id: "src-b",
    name: "Source B",
    originUrl: "https://b.example.com",
    kind: "rss",
    now: now(0),
  });
  await createSource(db, {
    id: "src-c",
    name: "Source C",
    originUrl: "https://c.example.com",
    kind: "rss",
    now: now(0),
  });
  await createFeed(db, {
    id: "feed-a",
    sourceId: "src-a",
    url: "https://a.example.com/feed",
    format: "rss",
    now: now(0),
  });
  await createFeed(db, {
    id: "feed-b",
    sourceId: "src-b",
    url: "https://b.example.com/feed",
    format: "rss",
    now: now(0),
  });
  await createFeed(db, {
    id: "feed-c",
    sourceId: "src-c",
    url: "https://c.example.com/feed",
    format: "rss",
    now: now(0),
  });
  const rawItems = [
    { id: "raw-a1", feedId: "feed-a", sourceId: "src-a" },
    { id: "raw-a2", feedId: "feed-a", sourceId: "src-a" },
    { id: "raw-a3", feedId: "feed-a", sourceId: "src-a" },
    { id: "raw-b1", feedId: "feed-b", sourceId: "src-b" },
    { id: "raw-b2", feedId: "feed-b", sourceId: "src-b" },
    { id: "raw-c1", feedId: "feed-c", sourceId: "src-c" },
    { id: "raw-c2", feedId: "feed-c", sourceId: "src-c" },
  ];
  for (const item of rawItems) {
    await createRawItem(db, {
      ...item,
      externalId: `ext-${item.id}`,
      url: `https://example.com/${item.id}`,
      fetchedAt: now(0),
      payloadHash: `hash-${item.id}`,
    });
  }

  const stories = [
    { id: "story-1", entities: [TOPIC_TECH, TOPIC_AI] },
    { id: "story-2", entities: [TOPIC_TECH, TOPIC_AI] },
    { id: "story-3", entities: [TOPIC_SPORT] },
    { id: "story-4", entities: [TOPIC_TECH] },
    { id: "story-5", entities: [TOPIC_AI] },
    { id: "story-6", entities: [TOPIC_SPORT, TOPIC_TECH] },
    { id: "story-7", entities: [TOPIC_TECH] },
  ];
  for (const topic of [TOPIC_TECH, TOPIC_SPORT, TOPIC_AI]) {
    await createEntity(db, {
      id: topic,
      name: topic,
      kind: "concept",
      now: now(0),
    });
  }
  for (const story of stories) {
    await createStory(db, {
      id: story.id,
      title: `Story ${story.id}`,
      now: now(0),
    });
  }
  const storySourceRawItem: Record<string, string> = {
    "story-1": "raw-a1",
    "story-2": "raw-a2",
    "story-3": "raw-b1",
    "story-4": "raw-c1",
    "story-5": "raw-b2",
    "story-6": "raw-c2",
    "story-7": "raw-a3",
  };
  for (const story of stories) {
    await addStorySource(db, {
      id: `ss-${story.id}`,
      storyId: story.id,
      rawItemId: storySourceRawItem[story.id],
      role: "primary",
      now: now(0),
    });
    for (const entityId of story.entities) {
      await addStoryEntity(db, {
        storyId: story.id,
        entityId,
        role: "subject",
      });
    }
  }

  const articles = [
    { id: "art-1", storyId: "story-1", minute: 7 },
    { id: "art-2", storyId: "story-2", minute: 6 },
    { id: "art-3", storyId: "story-3", minute: 5 },
    { id: "art-4", storyId: "story-4", minute: 4 },
    { id: "art-5", storyId: "story-5", minute: 3 },
    { id: "art-6", storyId: "story-6", minute: 2 },
    { id: "art-7", storyId: "story-7", minute: 1 },
  ];
  for (const article of articles) {
    await createArticle(db, {
      id: article.id,
      storyId: article.storyId,
      now: now(article.minute),
    });
    await addRevision(db, {
      id: `rev-${article.id}`,
      articleId: article.id,
      title: `Article ${article.id}`,
      body: "body",
      now: now(article.minute),
    });
    await transitionArticle(db, article.id, "ai_qa", now(article.minute));
    await transitionArticle(
      db,
      article.id,
      "auto_eligible",
      now(article.minute),
    );
    await transitionArticle(
      db,
      article.id,
      "scheduled",
      now(article.minute),
    );
    await publishArticle(
      db,
      article.id,
      `rev-${article.id}`,
      now(article.minute),
    );
  }

  await createReaderEvents(db, [
    ...Array.from({ length: 5 }, (_, index) => ({
      id: `ev-3-${index}`,
      eventType: "open_article" as const,
      articleId: "art-3",
      occurredAt: "2026-01-03T01:00:00.000Z",
      createdAt: "2026-01-03T01:00:00.000Z",
    })),
    ...Array.from({ length: 3 }, (_, index) => ({
      id: `ev-4-${index}`,
      eventType: "open_article" as const,
      articleId: "art-4",
      occurredAt: "2026-01-03T01:00:00.000Z",
      createdAt: "2026-01-03T01:00:00.000Z",
    })),
    {
      id: "ev-1-old",
      eventType: "open_article" as const,
      articleId: "art-1",
      occurredAt: "2026-01-02T12:00:00.000Z",
      createdAt: "2026-01-02T12:00:00.000Z",
    },
  ]);

  await upsertReaderProfile(
    db,
    "u1",
    { followedTopicIds: [TOPIC_SPORT] },
    now(0),
  );
  await upsertReaderProfile(
    db,
    "u2",
    { hiddenTopicIds: [TOPIC_TECH] },
    now(0),
  );
  await upsertReaderProfile(
    db,
    "u3",
    { followedTopicIds: [TOPIC_TECH] },
    now(0),
  );

  return { db, close };
}

function poolOf(
  candidates: RecommendationCandidate[],
  articleId: string,
): RecommendationCandidate["pool"] | undefined {
  return candidates.find((c) => c.articleId === articleId)?.pool;
}

test("fresh pool ranks published articles by recency", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {});
    assert.equal(candidates[0].articleId, "art-1");
    assert.equal(candidates[0].pool, "fresh");
    assert.equal(candidates[0].reason, "Mới xuất bản");
    assert.equal(candidates.length, 6);
    assert.deepEqual(
      candidates.map((c) => c.articleId),
      ["art-1", "art-2", "art-3", "art-4", "art-5", "art-6"],
    );
  } finally {
    close();
  }
});

test("fresh pool respects the requested limit", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, { limit: 3 });
    assert.equal(candidates.length, 3);
  } finally {
    close();
  }
});

test("trending pool ranks by in-window reader events", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      since: TRENDING_SINCE,
    });
    assert.equal(candidates[0].articleId, "art-3");
    assert.equal(candidates[0].pool, "trending");
    assert.equal(candidates[0].reason, "Đang được đọc nhiều");
    assert.equal(poolOf(candidates, "art-4"), "trending");
    assert.equal(
      poolOf(candidates, "art-1"),
      "fresh",
      "out-of-window events must not count as trending",
    );
  } finally {
    close();
  }
});

test("followed pool surfaces articles in followed topics", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      userId: "u1",
      since: TRENDING_SINCE,
    });
    assert.equal(poolOf(candidates, "art-3"), "followed");
    assert.equal(poolOf(candidates, "art-6"), "followed");
    assert.equal(
      candidates.find((c) => c.articleId === "art-3")?.reason,
      "Theo chủ đề bạn theo dõi",
    );
    assert.notEqual(poolOf(candidates, "art-1"), "followed");
    assert.notEqual(poolOf(candidates, "art-2"), "followed");
  } finally {
    close();
  }
});

test("related pool ranks by shared entity count", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      articleId: "art-1",
      since: TRENDING_SINCE,
    });
    const related = candidates.filter((c) => c.pool === "related");
    assert.equal(related[0].articleId, "art-2");
    assert.deepEqual(
      related.map((c) => c.articleId),
      ["art-2", "art-5", "art-6", "art-7"],
    );
    assert.equal(
      poolOf(candidates, "art-4"),
      "trending",
      "art-4 trends stronger than it relates",
    );
    assert.equal(
      poolOf(candidates, "art-1"),
      undefined,
      "current article is never recommended",
    );
    assert.equal(poolOf(candidates, "art-3"), "trending");
  } finally {
    close();
  }
});

test("diversity guard caps articles per source", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      limit: 7,
      since: TRENDING_SINCE,
    });
    assert.equal(MAX_ARTICLES_PER_SOURCE, 2);
    const fromSourceA = candidates.filter((c) =>
      ["art-1", "art-2", "art-7"].includes(c.articleId),
    );
    assert.equal(fromSourceA.length, 2);
    assert.equal(poolOf(candidates, "art-7"), undefined);
    assert.equal(candidates.length, 6);
  } finally {
    close();
  }
});

test("hidden topics are excluded as negative feedback", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      userId: "u2",
      since: TRENDING_SINCE,
    });
    assert.deepEqual(
      candidates.map((c) => c.articleId),
      ["art-3", "art-5"],
    );
  } finally {
    close();
  }
});

test("an article surfaces once even when several pools match", async () => {
  const { db, close } = await seedFixture();
  try {
    const candidates = await buildRecommendations(db, {
      userId: "u3",
      articleId: "art-1",
      since: TRENDING_SINCE,
    });
    const occurrences = candidates.filter(
      (c) => c.articleId === "art-2",
    );
    assert.equal(occurrences.length, 1);
    assert.equal(
      occurrences[0].pool,
      "followed",
      "tie between followed and related resolves to the higher-weight pool",
    );
  } finally {
    close();
  }
});
