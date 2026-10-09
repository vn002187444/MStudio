import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";
import type { ReaderEventMessage } from "@mstudio/contracts";
import {
  getReaderProfile,
  listReaderEventsByArticle,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { createLogger } from "@mstudio/observability";
import {
  processEventBatch,
  quotaAllowsAnalytics,
  quotaModeFromEnv,
} from "./analytics.ts";
import worker from "./index.ts";

function message(
  id: string,
  overrides: Partial<ReaderEventMessage> = {},
): ReaderEventMessage {
  return {
    id,
    eventType: "open_article",
    articleId: `article-${id}`,
    occurredAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function testEnv(
  db: D1Database | undefined,
  overrides: Record<string, string | undefined> = {},
): Env {
  return {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
    QUOTA_MODE: "NORMAL",
    ...overrides,
  } as unknown as Env;
}

function testLogger(): Logger {
  return createLogger({
    environment: "test",
    logLevel: "error",
    correlationId: "test",
  });
}

test("processEventBatch inserts events and updates reader profiles", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const outcome = await processEventBatch(
      [
        message("e1", { userId: "u1", articleId: "a1" }),
        message("e2", {
          userId: "u1",
          topicId: "t1",
          eventType: "follow_topic",
        }),
        message("e3", {
          userId: "u1",
          topicId: "t2",
          eventType: "hide_topic",
        }),
        message("e4", { userId: "u2", articleId: "a2", eventType: "share" }),
      ],
      testEnv(db),
      testLogger(),
    );
    assert.deepEqual(outcome, {
      inserted: 4,
      profilesUpdated: 1,
      dropped: 0,
    });
    const articlePage = await listReaderEventsByArticle(db, "a1");
    assert.equal(articlePage.rows.length, 1);
    assert.equal(articlePage.rows[0].eventType, "open_article");
    const profile = await getReaderProfile(db, "u1");
    assert.deepEqual(profile?.followedTopicIds, ["t1"]);
    assert.deepEqual(profile?.hiddenTopicIds, ["t2"]);
  } finally {
    close();
  }
});

test("processEventBatch drops events in SAFE quota mode", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const outcome = await processEventBatch(
      [message("e1")],
      testEnv(db, { QUOTA_MODE: "SAFE" }),
      testLogger(),
    );
    assert.deepEqual(outcome, {
      inserted: 0,
      profilesUpdated: 0,
      dropped: 1,
      reason: "quota_safe",
    });
    const page = await listReaderEventsByArticle(db, "article-e1");
    assert.equal(page.rows.length, 0);
  } finally {
    close();
  }
});

test("processEventBatch drops events in STOP quota mode", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const outcome = await processEventBatch(
      [message("e1")],
      testEnv(db, { QUOTA_MODE: "STOP" }),
      testLogger(),
    );
    assert.equal(outcome.inserted, 0);
    assert.equal(outcome.dropped, 1);
    assert.equal(outcome.reason, "quota_stop");
  } finally {
    close();
  }
});

test("processEventBatch processes events in WARN quota mode", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const outcome = await processEventBatch(
      [message("e1")],
      testEnv(db, { QUOTA_MODE: "WARN" }),
      testLogger(),
    );
    assert.equal(outcome.inserted, 1);
    assert.equal(outcome.dropped, 0);
  } finally {
    close();
  }
});

test("processEventBatch drops events when the kill switch is off", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const outcome = await processEventBatch(
      [message("e1")],
      testEnv(db, { FEATURE_READER_EVENTS_ENABLED: "off" }),
      testLogger(),
    );
    assert.deepEqual(outcome, {
      inserted: 0,
      profilesUpdated: 0,
      dropped: 1,
      reason: "disabled",
    });
  } finally {
    close();
  }
});

test("quotaModeFromEnv parses case-insensitive modes and defaults to NORMAL", () => {
  assert.equal(quotaModeFromEnv({}), "NORMAL");
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "bogus" }), "NORMAL");
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "safe" }), "SAFE");
  assert.equal(quotaModeFromEnv({ QUOTA_MODE: "STOP" }), "STOP");
});

test("quotaAllowsAnalytics mirrors QuotaGuard analytics-event semantics", () => {
  assert.equal(quotaAllowsAnalytics("NORMAL"), true);
  assert.equal(quotaAllowsAnalytics("WARN"), true);
  assert.equal(quotaAllowsAnalytics("SAFE"), false);
  assert.equal(quotaAllowsAnalytics("STOP"), false);
});

interface MockMessage {
  body: ReaderEventMessage;
  ack(): void;
  retry(): void;
}

function mockBatch(messages: ReaderEventMessage[]): {
  batch: MessageBatch<ReaderEventMessage>;
  acked: { count: number };
  retried: { count: number };
} {
  const acked = { count: 0 };
  const retried = { count: 0 };
  const batch = {
    messages: messages.map((body) => ({
      body,
      ack: () => {
        acked.count += 1;
      },
      retry: () => {
        retried.count += 1;
      },
    })),
  } as unknown as MessageBatch<ReaderEventMessage>;
  return { batch, acked, retried };
}

test("queue handler acks messages after processing", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
    const { batch, acked, retried } = mockBatch([
      message("e1", { userId: "u1", articleId: "a1" }),
      message("e2", { userId: "u1", articleId: "a2" }),
    ]);
    await worker.queue(batch, testEnv(db), ctx);
    assert.equal(acked.count, 2);
    assert.equal(retried.count, 0);
    const page = await listReaderEventsByArticle(db, "a1");
    assert.equal(page.rows.length, 1);
  } finally {
    close();
  }
});

test("queue handler retries messages when processing fails", async () => {
  const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
  const { batch, acked, retried } = mockBatch([message("e1")]);
  await worker.queue(batch, testEnv(undefined), ctx);
  assert.equal(acked.count, 0);
  assert.equal(retried.count, 1);
});
