import { test, assert } from "node:test";
import { runScheduler } from "./scheduler.ts";
import {
  createFeed,
  createSource,
  setSourceAllowStatus,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { RSS_SAMPLE } from "./fixtures/rss-sample.ts";
import type { NormalizeJobMessage } from "./scheduler.ts";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";

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

async function seedFeeds(db: D1Database, count: number): Promise<void> {
  await createSource(db, {
    id: "source-bench",
    name: "Source Bench",
    originUrl: "https://source-bench.example.com",
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  await setSourceAllowStatus(db, "source-bench", "approved");

  for (let i = 0; i < count; i++) {
    await createFeed(db, {
      id: `feed-bench-${i}`,
      sourceId: "source-bench",
      url: `https://example.com/feed-${i}.xml`,
      format: "rss",
      now: "2026-01-01T00:00:00.000Z",
    });
  }
}

test("benchmark runScheduler", async () => {
  const numFeeds = 100;
  const { env, db, close } = await setup();
  const fetchMock = mockFetch(() => rssResponse(RSS_SAMPLE));

  try {
    await seedFeeds(db, numFeeds);

    // Warmup
    await runScheduler(env, capturingLogger());

    const start = performance.now();
    for (let i = 0; i < 5; i++) {
      await runScheduler(env, capturingLogger());
    }
    const end = performance.now();

    console.log(`Benchmark time for 5 runs with ${numFeeds} feeds: ${end - start}ms`);
  } finally {
    fetchMock.restore();
    close();
  }
});
