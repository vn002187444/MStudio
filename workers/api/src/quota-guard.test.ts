import assert from "node:assert/strict";
import { test } from "node:test";
import { openMigratedTestDb } from "@mstudio/db/testing";
import worker from "./index.ts";

function request(path: string, init?: RequestInit): Request {
  return new Request(`https://api.example.com${path}`, init);
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function context(): { waitUntil(): void } {
  return { waitUntil: () => {} };
}

test("QUOTA_MODE=SAFE drops analytics events but keeps 202", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const env = {
      DB: db,
      ENVIRONMENT: "test",
      LOG_LEVEL: "error",
      QUOTA_MODE: "SAFE",
    } as unknown as Env;
    const response = await worker.fetch(
      request(
        "/events",
        jsonInit({
          events: [
            {
              eventType: "open_article",
              articleId: "a1",
              userId: "u1",
            },
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
    assert.equal(body.accepted, 0);
    assert.equal(body.sampledOut, 1);
    const rows = await db
      .prepare("SELECT COUNT(*) AS count FROM reader_events")
      .first<{ count: number }>();
    assert.equal(rows?.count ?? 0, 0);
  } finally {
    close();
  }
});

test("NORMAL serves reader GET endpoints while tracking usage", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const env = {
      DB: db,
      ENVIRONMENT: "test",
      LOG_LEVEL: "error",
    } as unknown as Env;
    const categories = await worker.fetch(
      request("/categories"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(categories.status, 200);
    const healthz = await worker.fetch(
      request("/healthz"),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(healthz.status, 200);
  } finally {
    close();
  }
});
