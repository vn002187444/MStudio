import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { ReaderEventMessage } from "@mstudio/contracts";
import {
  createLogger,
  InMemoryQuotaGuard,
  recordAnalyticsEvents,
  type Logger,
} from "@mstudio/observability";
import {
  countModelUsage,
  processEventBatch,
} from "./analytics.ts";
import worker from "./index.ts";
import { openMigratedTestDb } from "@mstudio/db/testing";

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

async function seedAgentRun(
  db: D1Database,
  id: string,
  createdAt: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO agent_runs (id, story_id, type, prompt_version, model, evidence_refs, input, created_at)
       VALUES (?, 'story-1', 'evidence', 'v1', 'gemini-3.1-flash-lite', '[]', '{}', ?)`,
    )
    .bind(id, createdAt)
    .run();
}

test("countModelUsage counts agent runs within the rolling window", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedAgentRun(db, "r-fresh", new Date().toISOString());
    await seedAgentRun(
      db,
      "r-stale",
      new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    );
    assert.equal(await countModelUsage(db, 24), 1);
    assert.equal(await countModelUsage(db, 72), 2);
  } finally {
    close();
  }
});

test("GET /internal/model-usage serves the rolling agent-run count", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedAgentRun(db, "r-1", new Date().toISOString());
    const response = await worker.fetch(
      new Request("https://analytics.example.com/internal/model-usage"),
      testEnv(db),
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      modelUsage: number;
      windowHours: number;
    };
    assert.equal(body.modelUsage, 1);
    assert.equal(body.windowHours, 24);
  } finally {
    close();
  }
});

test("processed events are recordable against the quota guard", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const guard = new InMemoryQuotaGuard({
      warn: {},
      safe: { analyticsEvents: 100 },
      stop: { analyticsEvents: 200 },
    });
    const outcome = await processEventBatch(
      [message("e1"), message("e2")],
      testEnv(db),
      testLogger(),
    );
    assert.equal(outcome.inserted, 2);
    recordAnalyticsEvents(guard, outcome.inserted);
    assert.equal(guard.mode(), "NORMAL");
    recordAnalyticsEvents(guard, 198);
    assert.equal(guard.mode(), "STOP");
  } finally {
    close();
  }
});
