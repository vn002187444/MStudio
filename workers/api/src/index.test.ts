import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  ApiErrorResponse,
  FeedRecord,
  SourceRecord,
} from "@mstudio/contracts";
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
  close(): void;
}> {
  const { db, close } = await openMigratedTestDb();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  return { env, close };
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
