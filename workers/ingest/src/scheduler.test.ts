import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";
import {
  createFeed,
  createSource,
  getFeed,
  setFeedEnabled,
  setSourceAllowStatus,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { RSS_SAMPLE, RSS_SAMPLE_ALT } from "./fixtures/rss-sample.ts";
import { runScheduler, sha256Hex } from "./scheduler.ts";
import type { NormalizeJobMessage } from "./scheduler.ts";

interface CapturedError {
  message: string;
  data: Record<string, unknown>;
}

interface CapturingLogger extends Logger {
  errors: CapturedError[];
}

function capturingLogger(): CapturingLogger {
  const errors: CapturedError[] = [];
  const noop = () => {};
  return {
    debug: noop,
    info: noop,
    warn: noop,
    error: (message, data) => {
      errors.push({ message, data: data ?? {} });
    },
    errors,
  };
}

interface MockR2 {
  get(key: string): Promise<{ key: string } | null>;
  put(
    key: string,
    body: string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
  objects: Map<string, { body: string; contentType: string }>;
}

function mockR2(): MockR2 {
  const objects = new Map<string, { body: string; contentType: string }>();
  return {
    async get(key: string) {
      return objects.has(key) ? { key } : null;
    },
    async put(
      key: string,
      body: string,
      options?: { httpMetadata?: { contentType?: string } },
    ) {
      objects.set(key, {
        body,
        contentType: options?.httpMetadata?.contentType ?? "",
      });
    },
    objects,
  };
}

interface MockQueue {
  send(message: NormalizeJobMessage): Promise<void>;
  messages: NormalizeJobMessage[];
}

function mockQueue(): MockQueue {
  const messages: NormalizeJobMessage[] = [];
  return {
    async send(message: NormalizeJobMessage) {
      messages.push(message);
    },
    messages,
  };
}

async function setup(): Promise<{
  env: Env;
  db: D1Database;
  close(): void;
  r2: MockR2;
  queue: MockQueue;
  logger: CapturingLogger;
}> {
  const { db, close } = await openMigratedTestDb();
  const r2 = mockR2();
  const queue = mockQueue();
  const logger = capturingLogger();
  const env = {
    DB: db,
    RAW_BUCKET: r2,
    NORMALIZE_QUEUE: queue,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  return { env, db, close, r2, queue, logger };
}

async function seedFeed(
  db: D1Database,
  id: string,
  url: string,
  options: { allowStatus?: "approved" | "pending" | "denied"; enabled?: boolean } = {},
): Promise<void> {
  const sourceId = `source-${id}`;
  await createSource(db, {
    id: sourceId,
    name: `Source ${id}`,
    originUrl: `https://source-${id}.example.com`,
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  if (options.allowStatus) {
    await setSourceAllowStatus(db, sourceId, options.allowStatus);
  } else {
    await setSourceAllowStatus(db, sourceId, "approved");
  }
  await createFeed(db, {
    id: `feed-${id}`,
    sourceId,
    url,
    format: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  if (options.enabled === false) {
    await setFeedEnabled(db, `feed-${id}`, false);
  }
}

function mockFetch(
  impl: (url: string) => Promise<Response> | Response,
): { calls: string[]; restore(): void } {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    calls.push(url);
    return impl(url);
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function rssResponse(body: string, contentType = "application/xml"): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

test("sha256Hex matches the known empty-string vector", async () => {
  assert.equal(
    await sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("fetches approved feeds and enqueues a compact queue message", async () => {
  const { env, db, close, r2, queue } = await setup();
  const fetchMock = mockFetch(() => rssResponse(RSS_SAMPLE));
  try {
    await seedFeed(db, "one", "https://example.com/feed.xml");
    const result = await runScheduler(env, capturingLogger());
    assert.deepEqual(result, {
      feeds: 1,
      enqueued: 1,
      duplicates: 0,
      failed: 0,
    });
    assert.deepEqual(fetchMock.calls, ["https://example.com/feed.xml"]);
    assert.equal(queue.messages.length, 1);
    const expectedHash = await sha256Hex(RSS_SAMPLE);
    assert.deepEqual(queue.messages[0], {
      feedId: "feed-one",
      hash: expectedHash,
      fetchedAt: queue.messages[0].fetchedAt,
      byteLength: new TextEncoder().encode(RSS_SAMPLE).length,
    });
    assert.ok(r2.objects.has(expectedHash));
    assert.equal(r2.objects.get(expectedHash)?.body, RSS_SAMPLE);
    const feed = await getFeed(db, "feed-one");
    assert.ok(feed?.lastFetchedAt);
    assert.equal(feed?.lastError, undefined);
  } finally {
    fetchMock.restore();
    close();
  }
});

test("skips feeds from unapproved sources", async () => {
  const { env, db, close } = await setup();
  const fetchMock = mockFetch(() => rssResponse(RSS_SAMPLE));
  try {
    await seedFeed(db, "pending", "https://example.com/pending.xml", {
      allowStatus: "pending",
    });
    const result = await runScheduler(env, capturingLogger());
    assert.deepEqual(result, {
      feeds: 0,
      enqueued: 0,
      duplicates: 0,
      failed: 0,
    });
    assert.deepEqual(fetchMock.calls, []);
  } finally {
    fetchMock.restore();
    close();
  }
});

test("skips disabled feeds", async () => {
  const { env, db, close } = await setup();
  const fetchMock = mockFetch(() => rssResponse(RSS_SAMPLE));
  try {
    await seedFeed(db, "off", "https://example.com/off.xml", {
      enabled: false,
    });
    const result = await runScheduler(env, capturingLogger());
    assert.equal(result.feeds, 0);
    assert.deepEqual(fetchMock.calls, []);
  } finally {
    fetchMock.restore();
    close();
  }
});

test("scheduler handles multiple feeds in one run", async () => {
  const { env, db, close, queue } = await setup();
  const fetchMock = mockFetch((url) =>
    url.includes("another")
      ? rssResponse(RSS_SAMPLE_ALT)
      : rssResponse(RSS_SAMPLE),
  );
  try {
    await seedFeed(db, "one", "https://example.com/feed.xml");
    await seedFeed(db, "two", "https://another.example.com/feed.xml");
    const result = await runScheduler(env, capturingLogger());
    assert.deepEqual(result, {
      feeds: 2,
      enqueued: 2,
      duplicates: 0,
      failed: 0,
    });
    assert.equal(queue.messages.length, 2);
    assert.notEqual(
      queue.messages[0].hash,
      queue.messages[1].hash,
    );
  } finally {
    fetchMock.restore();
    close();
  }
});

test("idempotent trigger does not duplicate queue messages", async () => {
  const { env, db, close, r2, queue } = await setup();
  const fetchMock = mockFetch(() => rssResponse(RSS_SAMPLE));
  try {
    await seedFeed(db, "one", "https://example.com/feed.xml");
    const first = await runScheduler(env, capturingLogger());
    assert.equal(first.enqueued, 1);
    const second = await runScheduler(env, capturingLogger());
    assert.deepEqual(second, {
      feeds: 1,
      enqueued: 0,
      duplicates: 1,
      failed: 0,
    });
    assert.equal(queue.messages.length, 1);
    assert.equal(r2.objects.size, 1);
    assert.equal(fetchMock.calls.length, 2);
  } finally {
    fetchMock.restore();
    close();
  }
});

test("logs failures and persists the feed error", async () => {
  const { env, db, close, queue, logger } = await setup();
  const fetchMock = mockFetch(() => {
    throw new Error("ETIMEDOUT");
  });
  try {
    await seedFeed(db, "one", "https://example.com/feed.xml");
    const result = await runScheduler(env, logger);
    assert.deepEqual(result, {
      feeds: 1,
      enqueued: 0,
      duplicates: 0,
      failed: 1,
    });
    assert.equal(queue.messages.length, 0);
    assert.equal(logger.errors.length, 1);
    assert.equal(logger.errors[0].message, "feed_fetch_failed");
    assert.equal(logger.errors[0].data.code, "FETCH_FAILED");
    assert.equal(logger.errors[0].data.feedId, "feed-one");
    assert.equal(logger.errors[0].data.message, "ETIMEDOUT");
    const feed = await getFeed(db, "feed-one");
    assert.equal(feed?.lastError, "ETIMEDOUT");
    assert.ok(feed?.lastFetchedAt);
  } finally {
    fetchMock.restore();
    close();
  }
});

test("treats non-ok responses as failures", async () => {
  const { env, db, close, logger } = await setup();
  const fetchMock = mockFetch(() => rssResponse("boom", "text/plain"));
  try {
    await seedFeed(db, "one", "https://example.com/feed.xml");
    globalThis.fetch = (async () =>
      new Response("server error", { status: 500 })) as typeof fetch;
    const result = await runScheduler(env, logger);
    assert.equal(result.failed, 1);
    const feed = await getFeed(db, "feed-one");
    assert.equal(feed?.lastError, "HTTP 500 from https://example.com/feed.xml");
  } finally {
    fetchMock.restore();
    close();
  }
});

test("processes one page of feeds per run to avoid throttling", async () => {
  const { env, db, close, queue } = await setup();
  const fetchMock = mockFetch((url) =>
    rssResponse(`${RSS_SAMPLE}\n<!-- ${url} -->`),
  );
  try {
    for (const index of [1, 2, 3, 4, 5]) {
      await seedFeed(
        db,
        `feed-${index}`,
        `https://example.com/${index}.xml`,
      );
    }
    const result = await runScheduler(env, capturingLogger(), {
      pageSize: 2,
    });
    assert.deepEqual(result, {
      feeds: 2,
      enqueued: 2,
      duplicates: 0,
      failed: 0,
    });
    assert.equal(queue.messages.length, 2);
  } finally {
    fetchMock.restore();
    close();
  }
});
