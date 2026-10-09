import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type {
  ApiErrorResponse,
  FeedRecord,
  RawItemRecord,
  ReaderEventMessage,
  SourceRecord,
} from "@mstudio/contracts";
import {
  addRevision,
  addStorySource,
  createArticle,
  createFeed,
  createRawItem,
  createSource,
  createStory,
  publishArticle,
  setRawItemStatus,
  transitionArticle,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import worker from "./index.ts";

interface TestContext {
  waitUntil(): void;
}

function context(): TestContext {
  return { waitUntil: () => {} };
}

async function setup(): Promise<{
  env: Env;
  db: D1Database;
  close(): void;
}> {
  const { db, close } = await openMigratedTestDb();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  return { env, db, close };
}

function request(
  path: string,
  init?: RequestInit,
): Request {
  return new Request(`https://api.example.com${path}`, init);
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

test("GET /healthz reports ok", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/healthz"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean };
    assert.equal(body.ok, true);
  } finally {
    close();
  }
});

test("POST /sources creates a source", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example News",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const body = (await response.json()) as SourceRecord;
    assert.equal(body.name, "Example News");
    assert.equal(body.kind, "rss");
    assert.equal(body.rightsStatus, "unknown");
    assert.equal(body.allowStatus, "pending");
    assert.ok(body.id);
  } finally {
    close();
  }
});

test("POST /sources rejects invalid kind with field errors", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example News",
        originUrl: "not-a-url",
        kind: "newsletter",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.originUrl);
    assert.ok(body.error.details?.kind);
  } finally {
    close();
  }
});

test("POST /sources rejects non-object body", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "[1,2,3]",
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
  } finally {
    close();
  }
});

test("GET /sources paginates with keyset cursor", async () => {
  const { env, close } = await setup();
  try {
    for (const index of [0, 1, 2]) {
      const response = await worker.fetch(
        request("/sources", {
          ...jsonInit({
            name: `Source ${index + 1}`,
            originUrl: `https://source-${index + 1}.example.com`,
            kind: "rss",
          }),
        }),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 201);
    }
    const page1 = await worker.fetch(
      request("/sources?limit=2"),
      env,
      context() as unknown as ExecutionContext,
    );
    const first = (await page1.json()) as {
      rows: SourceRecord[];
      nextCursor?: { createdAt: string; id: string };
    };
    assert.equal(first.rows.length, 2);
    const cursor = first.nextCursor;
    assert.ok(cursor);
    const params = new URLSearchParams({
      limit: "2",
      cursor_created_at: cursor.createdAt,
      cursor_id: cursor.id,
    });
    const page2 = await worker.fetch(
      request(`/sources?${params}`),
      env,
      context() as unknown as ExecutionContext,
    );
    const second = (await page2.json()) as {
      rows: SourceRecord[];
      nextCursor?: unknown;
    };
    assert.equal(second.rows.length, 1);
    assert.equal(second.nextCursor, undefined);
    assert.notEqual(first.rows[0].id, second.rows[0].id);
  } finally {
    close();
  }
});

test("GET /sources/:id returns 404 for missing source", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources/missing"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "SOURCE_NOT_FOUND");
  } finally {
    close();
  }
});

test("PATCH /sources/:id/allow-status updates status", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/allow-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowStatus: "approved" }),
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const updated = (await response.json()) as SourceRecord;
    assert.equal(updated.allowStatus, "approved");
  } finally {
    close();
  }
});

test("PATCH /sources/:id/allow-status rejects invalid status", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/allow-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowStatus: "banned" }),
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
  } finally {
    close();
  }
});

test("POST /sources/:id/feeds creates a feed", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const feed = (await response.json()) as FeedRecord;
    assert.equal(feed.sourceId, source.id);
    assert.equal(feed.enabled, true);
    assert.equal(feed.fetchIntervalSeconds, 900);
  } finally {
    close();
  }
});

test("GET /sources/:id/feeds paginates feeds", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    for (const index of [0, 1]) {
      const response = await worker.fetch(
        request(`/sources/${source.id}/feeds`, jsonInit({
          url: `https://example.com/${index + 1}.xml`,
          format: "rss",
        })),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 201);
    }
    const list = await worker.fetch(
      request(`/sources/${source.id}/feeds?limit=1`),
      env,
      context() as unknown as ExecutionContext,
    );
    const page = (await list.json()) as {
      rows: FeedRecord[];
      nextCursor?: unknown;
    };
    assert.equal(page.rows.length, 1);
    assert.ok(page.nextCursor);
  } finally {
    close();
  }
});

test("PATCH /feeds/:id disables a feed", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const feedResponse = await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const feed = (await feedResponse.json()) as FeedRecord;
    const response = await worker.fetch(
      request(`/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const updated = (await response.json()) as FeedRecord;
    assert.equal(updated.enabled, false);
  } finally {
    close();
  }
});

test("PATCH /feeds/:id rejects missing enabled field", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/feeds/missing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.enabled);
  } finally {
    close();
  }
});

test("DELETE /sources/:id removes source and cascades feeds", async () => {
  const { env, close } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      })),
      env,
      context() as unknown as ExecutionContext,
    );
    const response = await worker.fetch(
      request(`/sources/${source.id}`, { method: "DELETE" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 204);
    const after = await worker.fetch(
      request(`/sources/${source.id}`),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(after.status, 404);
    const feeds = await worker.fetch(
      request(`/sources/${source.id}/feeds`),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(feeds.status, 404);
  } finally {
    close();
  }
});

test("unknown routes return 404", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/unknown"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
  } finally {
    close();
  }
});

test("wrong method on /sources returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", { method: "PUT" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

const SEED_NOW = "2026-01-01T00:00:00.000Z";

async function seedRawItem(
  db: D1Database,
  id: string,
  status?: "normalized",
): Promise<void> {
  const sourceId = `source-${id}`;
  const feedId = `feed-${id}`;
  await createSource(db, {
    id: sourceId,
    name: `Source ${id}`,
    originUrl: `https://source-${id}.example.com`,
    kind: "rss",
    now: SEED_NOW,
  });
  await createFeed(db, {
    id: feedId,
    sourceId,
    url: `https://source-${id}.example.com/feed.xml`,
    format: "rss",
    now: SEED_NOW,
  });
  await createRawItem(db, {
    id,
    feedId,
    sourceId,
    externalId: `ext-${id}`,
    url: `https://source-${id}.example.com/story`,
    fetchedAt: SEED_NOW,
    payloadHash: `hash-${id}`,
  });
  if (status) {
    await setRawItemStatus(db, id, status);
  }
}

test("GET /raw-items returns incoming items by default", async () => {
  const { env, db, close } = await setup();
  try {
    await seedRawItem(db, "item-1");
    const response = await worker.fetch(
      request("/raw-items"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const page = (await response.json()) as {
      rows: RawItemRecord[];
      nextCursor?: unknown;
    };
    assert.equal(page.rows.length, 1);
    assert.equal(page.rows[0].id, "item-1");
    assert.equal(page.rows[0].status, "incoming");
    assert.equal(page.nextCursor, undefined);
  } finally {
    close();
  }
});

test("GET /raw-items filters by status", async () => {
  const { env, db, close } = await setup();
  try {
    await seedRawItem(db, "item-1");
    await seedRawItem(db, "item-2", "normalized");
    const incoming = await worker.fetch(
      request("/raw-items?status=incoming"),
      env,
      context() as unknown as ExecutionContext,
    );
    const incomingPage = (await incoming.json()) as {
      rows: RawItemRecord[];
    };
    assert.equal(incomingPage.rows.length, 1);
    assert.equal(incomingPage.rows[0].id, "item-1");

    const normalized = await worker.fetch(
      request("/raw-items?status=normalized"),
      env,
      context() as unknown as ExecutionContext,
    );
    const normalizedPage = (await normalized.json()) as {
      rows: RawItemRecord[];
    };
    assert.equal(normalizedPage.rows.length, 1);
    assert.equal(normalizedPage.rows[0].id, "item-2");
    assert.equal(normalizedPage.rows[0].status, "normalized");
  } finally {
    close();
  }
});

test("GET /raw-items rejects invalid status", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/raw-items?status=bogus"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.status);
  } finally {
    close();
  }
});

test("GET /raw-items paginates with keyset cursor", async () => {
  const { env, db, close } = await setup();
  try {
    await seedRawItem(db, "item-1");
    await seedRawItem(db, "item-2");
    await seedRawItem(db, "item-3");
    const page1 = await worker.fetch(
      request("/raw-items?limit=2"),
      env,
      context() as unknown as ExecutionContext,
    );
    const first = (await page1.json()) as {
      rows: RawItemRecord[];
      nextCursor?: { createdAt: string; id: string };
    };
    assert.equal(first.rows.length, 2);
    const cursor = first.nextCursor;
    assert.ok(cursor);
    const params = new URLSearchParams({
      limit: "2",
      cursor_created_at: cursor.createdAt,
      cursor_id: cursor.id,
    });
    const page2 = await worker.fetch(
      request(`/raw-items?${params}`),
      env,
      context() as unknown as ExecutionContext,
    );
    const second = (await page2.json()) as {
      rows: RawItemRecord[];
      nextCursor?: unknown;
    };
    assert.equal(second.rows.length, 1);
    assert.equal(second.nextCursor, undefined);
    assert.notEqual(first.rows[0].id, second.rows[0].id);
  } finally {
    close();
  }
});

test("wrong method on /raw-items returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/raw-items", { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

interface SentMessage {
  body: ReaderEventMessage;
}

async function setupWithEventsQueue(
  samplingRate = "1",
): Promise<{
  env: Env;
  db: D1Database;
  sent: SentMessage[];
  close(): void;
}> {
  const { db, close } = await openMigratedTestDb();
  const sent: SentMessage[] = [];
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
    READER_EVENT_SAMPLING_RATE: samplingRate,
    EVENTS_QUEUE: {
      sendBatch: async (messages: Iterable<SentMessage>) => {
        sent.push(...messages);
      },
    },
  } as unknown as Env;
  return { env, db, sent, close };
}

test("POST /events accepts meaningful events and enqueues them", async () => {
  const { env, sent, close } = await setupWithEventsQueue();
  try {
    const response = await worker.fetch(
      request(
        "/events",
        jsonInit({
          events: [
            { eventType: "open_article", articleId: "a1", userId: "u1" },
            { eventType: "follow_topic", topicId: "t1", userId: "u1" },
          ],
        }),
      ),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 202);
    const body = (await response.json()) as {
      accepted: number;
      sampledOut: number;
    };
    assert.equal(body.accepted, 2);
    assert.equal(body.sampledOut, 0);
    assert.equal(sent.length, 2);
    assert.equal(sent[0].body.eventType, "open_article");
    assert.equal(sent[0].body.articleId, "a1");
    assert.equal(sent[0].body.userId, "u1");
    assert.ok(sent[0].body.id);
    assert.ok(sent[0].body.occurredAt);
  } finally {
    close();
  }
});

test("POST /events samples micro-interactions out", async () => {
  const { env, sent, close } = await setupWithEventsQueue("0");
  try {
    const response = await worker.fetch(
      request(
        "/events",
        jsonInit({
          events: [
            { eventType: "open_article", articleId: "a1" },
            { eventType: "click", articleId: "a1" },
            { eventType: "scroll", articleId: "a1" },
          ],
        }),
      ),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 202);
    const body = (await response.json()) as {
      accepted: number;
      sampledOut: number;
    };
    assert.equal(body.accepted, 1);
    assert.equal(body.sampledOut, 2);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].body.eventType, "open_article");
  } finally {
    close();
  }
});

test("POST /events rejects events without a target", async () => {
  const { env, close } = await setupWithEventsQueue();
  try {
    const response = await worker.fetch(
      request(
        "/events",
        jsonInit({
          events: [{ eventType: "open_article" }],
        }),
      ),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.["events[0].target"]);
  } finally {
    close();
  }
});

test("POST /events works without a queue binding", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request(
        "/events",
        jsonInit({
          events: [{ eventType: "open_article", articleId: "a1" }],
        }),
      ),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 202);
    const body = (await response.json()) as {
      accepted: number;
      sampledOut: number;
    };
    assert.equal(body.accepted, 1);
    assert.equal(body.sampledOut, 0);
  } finally {
    close();
  }
});

test("wrong method on /events returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/events", { method: "GET" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

test("GET /recommendations returns candidate list", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/recommendations?limit=5"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      candidates: unknown[];
    };
    assert.deepEqual(body.candidates, []);
  } finally {
    close();
  }
});

test("GET /recommendations rejects invalid limit", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/recommendations?limit=0"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
  } finally {
    close();
  }
});

test("GET /recommendations rejects empty userId", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/recommendations?userId="),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.userId);
  } finally {
    close();
  }
});

test("wrong method on /recommendations returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/recommendations", { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

async function seedPublishedArticle(): Promise<{
  env: Env;
  close(): void;
}> {
  const { db, close } = await openMigratedTestDb();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  const now = "2026-01-01T00:00:00.000Z";
  await createSource(db, {
    id: "src-1",
    name: "Source",
    originUrl: "https://example.com",
    kind: "rss",
    now,
  });
  await createFeed(db, {
    id: "feed-1",
    sourceId: "src-1",
    url: "https://example.com/feed",
    format: "rss",
    now,
  });
  await createRawItem(db, {
    id: "raw-1",
    feedId: "feed-1",
    sourceId: "src-1",
    externalId: "ext-1",
    url: "https://example.com/1",
    fetchedAt: now,
    payloadHash: "hash-1",
  });
  await createStory(db, { id: "story-1", title: "Story", now });
  await addStorySource(db, {
    id: "ss-1",
    storyId: "story-1",
    rawItemId: "raw-1",
    role: "primary",
    now,
  });
  await createArticle(db, {
    id: "art-1",
    storyId: "story-1",
    now,
  });
  await addRevision(db, {
    id: "rev-1",
    articleId: "art-1",
    title: "Published Title",
    body: "body",
    summary: "summary",
    now,
  });
  await transitionArticle(db, "art-1", "ai_qa", now);
  await transitionArticle(db, "art-1", "auto_eligible", now);
  await transitionArticle(db, "art-1", "scheduled", now);
  await publishArticle(db, "art-1", "rev-1", now);
  await createArticle(db, {
    id: "art-draft",
    storyId: "story-1",
    now,
  });
  return { env, close };
}

test("GET /articles/:id returns a published article with its title", async () => {
  const { env, close } = await seedPublishedArticle();
  try {
    const response = await worker.fetch(
      request("/articles/art-1"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      article: {
        id: string;
        storyId: string;
        status: string;
        title: string;
        summary?: string;
        publishedRevisionId: string;
      };
    };
    assert.equal(body.article.id, "art-1");
    assert.equal(body.article.storyId, "story-1");
    assert.equal(body.article.status, "published");
    assert.equal(body.article.title, "Published Title");
    assert.equal(body.article.summary, "summary");
    assert.equal(body.article.publishedRevisionId, "rev-1");
  } finally {
    close();
  }
});

test("GET /articles/:id returns 404 for a missing article", async () => {
  const { env, close } = await seedPublishedArticle();
  try {
    const response = await worker.fetch(
      request("/articles/does-not-exist"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "ARTICLE_NOT_FOUND");
  } finally {
    close();
  }
});

test("GET /articles/:id returns 404 for an unpublished article", async () => {
  const { env, close } = await seedPublishedArticle();
  try {
    const response = await worker.fetch(
      request("/articles/art-draft"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "ARTICLE_NOT_FOUND");
  } finally {
    close();
  }
});

test("wrong method on /articles/:id returns 405", async () => {
  const { env, close } = await seedPublishedArticle();
  try {
    const response = await worker.fetch(
      request("/articles/art-1", { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});
