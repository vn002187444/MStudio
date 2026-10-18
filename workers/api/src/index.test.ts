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
import { ARTICLE_STATUSES } from "@mstudio/contracts";
import {
  addRevision,
  addStorySource,
  createArticle,
  createFeed,
  createRawItem,
  createSession,
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
  adminToken: string;
}> {
  const { db, close } = await openMigratedTestDb();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  const { token } = await createSession(db, {
    userId: "admin-user",
    role: "admin",
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  return { env, db, close, adminToken: token };
}

function request(
  path: string,
  init?: RequestInit,
  token?: string,
): Request {
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return new Request(`https://api.example.com${path}`, {
    ...init,
    headers,
  });
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
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example News",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example News",
        originUrl: "not-a-url",
        kind: "newsletter",
      }), adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "[1,2,3]",
      }, adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    for (const index of [0, 1, 2]) {
      const response = await worker.fetch(
        request("/sources", {
          ...jsonInit({
            name: `Source ${index + 1}`,
            originUrl: `https://source-${index + 1}.example.com`,
            kind: "rss",
          }),
        }, adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/allow-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowStatus: "approved" }),
      }, adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/allow-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allowStatus: "banned" }),
      }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
  } finally {
    close();
  }
});

test("POST /sources/:id/feeds creates a feed", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      }), adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    for (const index of [0, 1]) {
      const response = await worker.fetch(
        request(`/sources/${source.id}/feeds`, jsonInit({
          url: `https://example.com/${index + 1}.xml`,
          format: "rss",
        }), adminToken),
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
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const feedResponse = await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const feed = (await feedResponse.json()) as FeedRecord;
    const response = await worker.fetch(
      request(`/feeds/${feed.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: false, url: "https://example.com/updated.xml" }),
      }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const updated = (await response.json()) as FeedRecord;
    assert.equal(updated.enabled, false);
    assert.equal(updated.url, "https://example.com/updated.xml");
  } finally {
    close();
  }
});

test("DELETE /feeds/:id deletes a feed", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const sourceResponse = await worker.fetch(
      request("/sources", jsonInit({
        name: "Test",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await sourceResponse.json()) as SourceRecord;
    const feedResponse = await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const feed = (await feedResponse.json()) as FeedRecord;
    const response = await worker.fetch(
      request(`/feeds/${feed.id}`, { method: "DELETE" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 204);
  } finally {
    close();
  }
});

test("PATCH /sources/:id updates a source", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const sourceResponse = await worker.fetch(
      request("/sources", jsonInit({
        name: "Test",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await sourceResponse.json()) as SourceRecord;
    const response = await worker.fetch(
      request(`/sources/${source.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Updated Test" }),
      }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const updated = (await response.json()) as SourceRecord;
    assert.equal(updated.name, "Updated Test");
  } finally {
    close();
  }
});

test("PATCH /feeds/:id rejects invalid fields", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/feeds/missing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fetchIntervalSeconds: "invalid" }),
      }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.details?.fetchIntervalSeconds);
  } finally {
    close();
  }
});

test("DELETE /sources/:id removes source and cascades feeds", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const created = await worker.fetch(
      request("/sources", jsonInit({
        name: "Example",
        originUrl: "https://example.com",
        kind: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    await worker.fetch(
      request(`/sources/${source.id}/feeds`, jsonInit({
        url: "https://example.com/feed.xml",
        format: "rss",
      }), adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const response = await worker.fetch(
      request(`/sources/${source.id}`, { method: "DELETE" }, adminToken),
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

test("GET /categories returns the seeded taxonomy", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/categories"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      categories: Array<{
        slug: string;
        labelVi: string;
        sort: number;
        status: string;
      }>;
    };
    assert.equal(body.categories.length, 19);
    for (const slug of ["thoi-su", "kinh-te", "khoa-hoc", "the-thao", "blockchain"]) {
      assert.ok(
        body.categories.some((c) => c.slug === slug),
        `missing category ${slug}`,
      );
    }
    assert.equal(body.categories[0].slug, "moi-nhat");
    assert.equal(body.categories[0].labelVi, "Mới nhất");
    assert.equal(body.categories[5].slug, "ai-channel");
    assert.equal(body.categories[9].slug, "goc-toi");
    assert.equal(body.categories[9].labelVi, "Góc Tối");
    // FU-18 phase 2 (Human-approved 10-10-2026)
    assert.equal(body.categories[10].slug, "kinh-doanh");
    assert.equal(body.categories[11].slug, "suc-khoe");
    assert.equal(body.categories[12].slug, "giao-duc");
    assert.equal(body.categories[13].slug, "xe");
    assert.equal(body.categories[18].slug, "blockchain");
    assert.equal(body.categories[18].labelVi, "Blockchain & Web3");
  } finally {
    close();
  }
});

test("wrong method on /categories returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/categories", { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

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

test("GET /articles lists published articles newest first", async () => {
  const { env, close } = await seedPublishedArticle();
  try {
    const response = await worker.fetch(
      request("/articles?limit=10"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      rows: Array<{ id: string; title: string; body: string }>;
      nextCursor?: { createdAt: string; id: string };
    };
    assert.equal(body.rows.length, 1);
    assert.equal(body.rows[0].id, "art-1");
    assert.equal(body.rows[0].title, "Published Title");
    assert.equal(typeof body.rows[0].body, "string");
    assert.equal(body.nextCursor, undefined);
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

test("GET /articles?status= requires a bearer token", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/articles?status=drafted"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 401);
  } finally {
    close();
  }
});

test("GET /articles?status= rejects a non-editorial role", async () => {
  const { env, db, close } = await setup();
  try {
    const { token } = await createSession(db, {
      userId: "analyst-user",
      role: "analyst",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
    const response = await worker.fetch(
      request("/articles?status=drafted", undefined, token),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 403);
  } finally {
    close();
  }
});

test("GET /articles?status= rejects an unknown status", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/articles?status=bogus", undefined, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
  } finally {
    close();
  }
});

test("GET /articles?status= lists the editorial queue for editors", async () => {
  const { env, db, close, adminToken } = await setup();
  try {
    await createStory(db, {
      id: "story-queue",
      title: "Queue Story",
      now: "2026-01-01T00:00:00.000Z",
    });
    await createArticle(db, {
      id: "art-queue",
      storyId: "story-queue",
      now: "2026-01-01T00:00:00.000Z",
    });
    const response = await worker.fetch(
      request("/articles?status=drafted", undefined, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      rows: Array<{ id: string; status: string }>;
    };
    assert.ok(body.rows.some((row) => row.id === "art-queue"));
    assert.ok(body.rows.every((row) => row.status === "drafted"));
  } finally {
    close();
  }
});

const SEED_LATER = "2026-02-01T00:00:00.000Z";

async function seedArticleStatuses(db: D1Database): Promise<void> {
  await createStory(db, {
    id: "story-counts",
    title: "Counts Story",
    now: SEED_NOW,
  });
  await createArticle(db, {
    id: "art-c1",
    storyId: "story-counts",
    now: SEED_NOW,
  });
  await createArticle(db, {
    id: "art-c2",
    storyId: "story-counts",
    now: SEED_NOW,
  });
  await createArticle(db, {
    id: "art-c3",
    storyId: "story-counts",
    now: SEED_NOW,
  });
  await addRevision(db, {
    id: "rev-c3",
    articleId: "art-c3",
    title: "Counts Headline",
    body: "body",
    now: SEED_NOW,
  });
  await transitionArticle(db, "art-c3", "ai_qa", SEED_NOW);
  await transitionArticle(db, "art-c3", "auto_eligible", SEED_NOW);
  await transitionArticle(db, "art-c3", "scheduled", SEED_NOW);
  await publishArticle(db, "art-c3", "rev-c3", SEED_NOW);
}

test("GET /articles/counts requires a bearer token", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/articles/counts"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 401);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "UNAUTHORIZED");
  } finally {
    close();
  }
});

test("GET /articles/counts rejects a non-editorial role", async () => {
  const { env, db, close } = await setup();
  try {
    const { token } = await createSession(db, {
      userId: "analyst-user",
      role: "analyst",
      expiresAt: "2099-01-01T00:00:00.000Z",
    });
    const response = await worker.fetch(
      request("/articles/counts", undefined, token),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 403);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "FORBIDDEN");
  } finally {
    close();
  }
});

test("GET /articles/counts returns totals for every status", async () => {
  const { env, db, close, adminToken } = await setup();
  try {
    await seedArticleStatuses(db);
    const response = await worker.fetch(
      request("/articles/counts", undefined, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      counts: Record<string, number>;
    };
    assert.equal(Object.keys(body.counts).length, ARTICLE_STATUSES.length);
    assert.equal(body.counts.drafted, 2);
    assert.equal(body.counts.published, 1);
    assert.equal(body.counts.ai_qa, 0);
    assert.equal(body.counts.scheduled, 0);
    assert.equal(body.counts.retracted, 0);
    assert.equal(
      body.counts.drafted +
        body.counts.published +
        body.counts.ai_qa +
        body.counts.human_review +
        body.counts.auto_eligible +
        body.counts.hold +
        body.counts.scheduled +
        body.counts.updated +
        body.counts.corrected +
        body.counts.retracted,
      3,
    );
  } finally {
    close();
  }
});

test("wrong method on /articles/counts returns 405", async () => {
  const { env, close, adminToken } = await setup();
  try {
    const response = await worker.fetch(
      request("/articles/counts", { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});

async function seedStoryAggregates(db: D1Database): Promise<void> {
  await createStory(db, { id: "story-a", title: "Story A", now: SEED_NOW });
  await createStory(db, {
    id: "story-b",
    title: "Story B",
    now: SEED_LATER,
  });
  await createArticle(db, {
    id: "art-a1",
    storyId: "story-a",
    now: SEED_NOW,
  });
  await addRevision(db, {
    id: "rev-a1",
    articleId: "art-a1",
    title: "A Headline",
    body: "body",
    now: SEED_NOW,
  });
  await transitionArticle(db, "art-a1", "ai_qa", SEED_NOW);
  await transitionArticle(db, "art-a1", "auto_eligible", SEED_NOW);
  await transitionArticle(db, "art-a1", "scheduled", SEED_NOW);
  await publishArticle(db, "art-a1", "rev-a1", SEED_NOW);
  await createArticle(db, {
    id: "art-a2",
    storyId: "story-a",
    now: SEED_NOW,
  });
  await createArticle(db, {
    id: "art-b1",
    storyId: "story-b",
    now: SEED_LATER,
  });
}

test("GET /stories aggregates stories newest first without a token", async () => {
  const { env, db, close } = await setup();
  try {
    await seedStoryAggregates(db);
    const response = await worker.fetch(
      request("/stories"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      rows: Array<{
        storyId: string;
        articleCount: number;
        statuses: string[];
        latestTitle?: string;
        latestUpdatedAt: string;
      }>;
    };
    assert.equal(body.rows.length, 2);

    const newest = body.rows[0];
    assert.equal(newest.storyId, "story-b");
    assert.equal(newest.articleCount, 1);
    assert.deepEqual(newest.statuses, ["drafted"]);
    assert.equal(newest.latestUpdatedAt, SEED_LATER);
    assert.equal(newest.latestTitle, undefined);

    const older = body.rows[1];
    assert.equal(older.storyId, "story-a");
    assert.equal(older.articleCount, 2);
    assert.deepEqual(older.statuses, ["drafted", "published"]);
    assert.equal(older.latestUpdatedAt, SEED_NOW);
    assert.equal(older.latestTitle, "A Headline");
  } finally {
    close();
  }
});

test("GET /stories caps the aggregate at 50 rows", async () => {
  const { env, db, close } = await setup();
  try {
    for (let index = 0; index < 52; index += 1) {
      const storyId = `story-limit-${index}`;
      await createStory(db, {
        id: storyId,
        title: `Story ${index}`,
        now: SEED_NOW,
      });
      await createArticle(db, {
        id: `art-limit-${index}`,
        storyId,
        now: SEED_NOW,
      });
    }
    const response = await worker.fetch(
      request("/stories"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { rows: unknown[] };
    assert.equal(body.rows.length, 50);
  } finally {
    close();
  }
});

test("wrong method on /stories returns 405", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/stories", { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 405);
  } finally {
    close();
  }
});
