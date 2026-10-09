import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  NormalizeJobMessage,
} from "@mstudio/contracts";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";
import {
  createFeed,
  createSource,
  listRawItemsByFeed,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import worker from "./index.ts";
import {
  canonicalUrlCandidate,
  normalizeParsedItems,
  processNormalizeMessage,
} from "./normalize.ts";
import {
  parseAtom,
  parseFeed,
  parseJsonFeed,
  parseRss,
} from "./parsers.ts";
import { sha256Hex } from "./sha256.ts";
import {
  ATOM_SAMPLE,
  JSONFEED_SAMPLE,
  RSS_SAMPLE,
} from "./fixtures/feed-samples.ts";

interface CapturedError {
  message: string;
  data: Record<string, unknown>;
}

interface CapturingLogger extends Logger {
  errors: CapturedError[];
  infos: CapturedError[];
}

function capturingLogger(): CapturingLogger {
  const errors: CapturedError[] = [];
  const infos: CapturedError[] = [];
  const noop = () => {};
  return {
    debug: noop,
    warn: noop,
    info: (message, data) => {
      infos.push({ message, data: data ?? {} });
    },
    error: (message, data) => {
      errors.push({ message, data: data ?? {} });
    },
    errors,
    infos,
  };
}

function mockR2(objects: Map<string, string>) {
  return {
    async get(key: string) {
      const body = objects.get(key);
      return body === undefined
        ? null
        : { key, text: async () => body };
    },
    async put(key: string, body: string) {
      objects.set(key, body);
    },
  };
}

async function setup(): Promise<{
  env: Env;
  db: D1Database;
  close(): void;
  logger: CapturingLogger;
  r2: ReturnType<typeof mockR2>;
  objects: Map<string, string>;
}> {
  const { db, close } = await openMigratedTestDb();
  const objects = new Map<string, string>();
  const r2 = mockR2(objects);
  const logger = capturingLogger();
  const env = {
    DB: db,
    RAW_BUCKET: r2,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  return { env, db, close, logger, r2, objects };
}

async function seedFeedPair(db: D1Database, id: string): Promise<void> {
  await createSource(db, {
    id: `source-${id}`,
    name: `Source ${id}`,
    originUrl: `https://source-${id}.example.com`,
    kind: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
  await createFeed(db, {
    id: `feed-${id}`,
    sourceId: `source-${id}`,
    url: `https://source-${id}.example.com/feed.xml`,
    format: "rss",
    now: "2026-01-01T00:00:00.000Z",
  });
}

function message(
  feedId: string,
  hash: string,
): NormalizeJobMessage {
  return {
    feedId,
    hash,
    fetchedAt: "2026-01-05T00:00:00.000Z",
    byteLength: 100,
  };
}

test("parses RSS fixture items", async () => {
  const items = parseRss(RSS_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://example.com/stories/first");
  assert.equal(
    items[0].externalId,
    "https://example.com/stories/first",
  );
  assert.equal(items[0].title, "First story");
  assert.equal(items[0].publishedAt, "Mon, 05 Jan 2026 00:00:00 GMT");
  assert.equal(items[0].content, "First sample story");
  assert.equal(
    items[1].externalId,
    "urn:example:second",
  );
});

test("parses Atom fixture items", async () => {
  const items = parseAtom(ATOM_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://atom.example.com/first");
  assert.equal(items[0].externalId, "urn:atom:first");
  assert.equal(items[0].title, "Atom first");
  assert.equal(items[0].publishedAt, "2026-01-05T00:00:00Z");
  assert.equal(items[0].content, "First atom entry");
  assert.equal(items[1].url, "https://atom.example.com/second");
});

test("parses JSONFeed fixture items", async () => {
  const items = parseJsonFeed(JSONFEED_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].externalId, "json-first");
  assert.equal(items[0].url, "https://jsonfeed.example.com/first");
  assert.equal(items[0].title, "JSON first");
  assert.equal(items[0].publishedAt, "2026-01-05T00:00:00Z");
  assert.equal(items[0].content, "<p>First json item</p>");
  assert.equal(items[1].content, "Second json item");
});

test("parseFeed dispatches by content shape", async () => {
  assert.equal(parseFeed(RSS_SAMPLE).length, 2);
  assert.equal(parseFeed(ATOM_SAMPLE).length, 2);
  assert.equal(parseFeed(JSONFEED_SAMPLE).length, 2);
  assert.equal(
    parseFeed(JSONFEED_SAMPLE, "application/json").length,
    2,
  );
});

test("canonical url prefers an http guid and falls back to url", async () => {
  assert.equal(
    canonicalUrlCandidate({
      url: "https://a.example.com/x",
      externalId: "https://a.example.com/x",
    }),
    "https://a.example.com/x",
  );
  assert.equal(
    canonicalUrlCandidate({
      url: "https://a.example.com/x",
      externalId: "urn:example:1",
    }),
    "https://a.example.com/x",
  );
  assert.equal(
    canonicalUrlCandidate({ url: "https://a.example.com/x" }),
    "https://a.example.com/x",
  );
});

test("normalizeParsedItems assigns stable distinct payload hashes", async () => {
  const base = {
    url: "https://a.example.com/1",
    title: "Story",
    publishedAt: "2026-01-05T00:00:00Z",
    content: "Body",
  };
  const first = await normalizeParsedItems([base]);
  const repeat = await normalizeParsedItems([base]);
  const other = await normalizeParsedItems([
    { ...base, url: "https://a.example.com/2" },
  ]);
  assert.equal(first[0].payloadHash, repeat[0].payloadHash);
  assert.notEqual(first[0].payloadHash, other[0].payloadHash);
  assert.equal(first[0].canonicalUrl, base.url);
});

test("processNormalizeMessage creates raw items from R2 content", async () => {
  const { env, db, close, logger, objects } = await setup();
  try {
    await seedFeedPair(db, "one");
    const hash = await sha256Hex(RSS_SAMPLE);
    objects.set(hash, RSS_SAMPLE);
    const outcome = await processNormalizeMessage(
      message("feed-one", hash),
      env,
      logger,
    );
    assert.deepEqual(outcome, { created: 2, duplicates: 0 });
    const page = await listRawItemsByFeed(db, "feed-one");
    assert.equal(page.rows.length, 2);
    const sortedRows = [...page.rows].sort((a, b) => a.url.localeCompare(b.url));
    const first = sortedRows[0];
    assert.equal(first.feedId, "feed-one");
    assert.equal(first.sourceId, "source-one");
    assert.equal(first.status, "incoming");
    assert.equal(first.url, "https://example.com/stories/first");
    assert.equal(
      first.canonicalUrl,
      "https://example.com/stories/first",
    );
    assert.equal(first.title, "First story");
    assert.equal(first.fetchedAt, "2026-01-05T00:00:00.000Z");
    const second = page.rows[1];
    assert.equal(
      second.canonicalUrl,
      "https://example.com/stories/second",
    );
    assert.equal(second.externalId, "urn:example:second");
  } finally {
    close();
  }
});

test("duplicate message does not duplicate rows", async () => {
  const { env, db, close, logger, objects } = await setup();
  try {
    await seedFeedPair(db, "one");
    const hash = await sha256Hex(RSS_SAMPLE);
    objects.set(hash, RSS_SAMPLE);
    const msg = message("feed-one", hash);
    const first = await processNormalizeMessage(msg, env, logger);
    assert.deepEqual(first, { created: 2, duplicates: 0 });
    const second = await processNormalizeMessage(msg, env, logger);
    assert.deepEqual(second, { created: 0, duplicates: 2 });
    const page = await listRawItemsByFeed(db, "feed-one");
    assert.equal(page.rows.length, 2);
  } finally {
    close();
  }
});

test("duplicate input with same external id across messages dedupes", async () => {
  const { env, db, close, logger, objects } = await setup();
  try {
    await seedFeedPair(db, "one");
    const firstHash = await sha256Hex(RSS_SAMPLE);
    objects.set(firstHash, RSS_SAMPLE);
    await processNormalizeMessage(
      message("feed-one", firstHash),
      env,
      logger,
    );
    const reFetched = `${RSS_SAMPLE}\n<!-- refetch -->`;
    const secondHash = await sha256Hex(reFetched);
    objects.set(secondHash, reFetched);
    const outcome = await processNormalizeMessage(
      message("feed-one", secondHash),
      env,
      logger,
    );
    assert.deepEqual(outcome, { created: 0, duplicates: 2 });
    const page = await listRawItemsByFeed(db, "feed-one");
    assert.equal(page.rows.length, 2);
  } finally {
    close();
  }
});

test("queue handler acks processed messages", async () => {
  const { env, close, objects } = await setup();
  try {
    await seedFeedPair(env.DB as D1Database, "one");
    const hash = await sha256Hex(RSS_SAMPLE);
    objects.set(hash, RSS_SAMPLE);
    const { batch, acks, retries } = mockBatch([
      message("feed-one", hash),
    ]);
    await worker.queue(batch, env, {} as ExecutionContext);
    assert.deepEqual(acks, [0]);
    assert.deepEqual(retries, []);
  } finally {
    close();
  }
});

test("queue handler retries failed messages", async () => {
  const { env, close } = await setup();
  try {
    await seedFeedPair(env.DB as D1Database, "one");
    const { batch, acks, retries } = mockBatch([
      message("feed-one", "missing-hash"),
    ]);
    await worker.queue(batch, env, {} as ExecutionContext);
    assert.deepEqual(acks, []);
    assert.deepEqual(retries, [0]);
  } finally {
    close();
  }
});

function mockBatch(messages: NormalizeJobMessage[]): {
  batch: MessageBatch<NormalizeJobMessage>;
  acks: number[];
  retries: number[];
} {
  const acks: number[] = [];
  const retries: number[] = [];
  const batch = {
    messages: messages.map((body, index) => ({
      body,
      ack: () => {
        acks.push(index);
      },
      retry: () => {
        retries.push(index);
      },
    })),
  };
  return {
    batch: batch as unknown as MessageBatch<NormalizeJobMessage>,
    acks,
    retries,
  };
}
