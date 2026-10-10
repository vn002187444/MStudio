import assert from "node:assert/strict";
import { test } from "node:test";
import { Hono } from "hono";
import type { D1Database } from "@cloudflare/workers-types";
import type { ApiErrorResponse, SourceRecord } from "@mstudio/contracts";
import {
  createSession,
  listAuditLog,
  type Role,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { minuteWindow, rateLimit } from "./auth.ts";
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
  tokenFor(role: Role): Promise<string>;
}> {
  const { db, close } = await openMigratedTestDb();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
  } as unknown as Env;
  return {
    env,
    db,
    close,
    tokenFor: async (role) => {
      const { token } = await createSession(db, {
        userId: `user-${role}`,
        role,
        expiresAt: "2099-01-01T00:00:00.000Z",
      });
      return token;
    },
  };
}

function request(
  path: string,
  init?: RequestInit,
): Request {
  return new Request(`https://api.example.com${path}`, init);
}

function jsonInit(
  body: unknown,
  token?: string,
): RequestInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  return {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };
}

const SOURCE_BODY = {
  name: "Example News",
  originUrl: "https://example.com",
  kind: "rss",
} as const;

test("POST /sources without a token returns 401", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY)),
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

test("POST /sources rejects malformed authorization headers", async () => {
  const { env, close } = await setup();
  try {
    for (const authorization of [
      "Token abc",
      "Bearer",
      "Bearer  ",
      "Bearer a b",
    ]) {
      const response = await worker.fetch(
        request("/sources", {
          ...jsonInit(SOURCE_BODY),
          headers: {
            "content-type": "application/json",
            authorization,
          },
        }),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 401, authorization);
    }
  } finally {
    close();
  }
});

test("POST /sources rejects an unknown or expired token", async () => {
  const { env, close } = await setup();
  try {
    const unknown = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY, "not-a-real-token")),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(unknown.status, 401);
    const { db } = { db: env.DB as D1Database };
    const { token } = await createSession(db, {
      userId: "user-expired",
      role: "admin",
      expiresAt: "2000-01-01T00:00:00.000Z",
    });
    const expired = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY, token)),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(expired.status, 401);
  } finally {
    close();
  }
});

test("RBAC matrix: every non-admin role is rejected on write endpoints", async () => {
  const { env, close, tokenFor } = await setup();
  try {
    const roles: Role[] = [
      "editor",
      "reviewer",
      "seo",
      "analyst",
    ];
    for (const role of roles) {
      const token = await tokenFor(role);
      const response = await worker.fetch(
        request("/sources", jsonInit(SOURCE_BODY, token)),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 403, role);
      const body = (await response.json()) as ApiErrorResponse;
      assert.equal(body.error.code, "FORBIDDEN");
    }
  } finally {
    close();
  }
});

test("admin passes the write guard and the write is audited", async () => {
  const { env, db, close, tokenFor } = await setup();
  try {
    const token = await tokenFor("admin");
    const response = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY, token)),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const source = (await response.json()) as SourceRecord;
    assert.equal(source.name, "Example News");
    const entries = await listAuditLog(db);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].actor, "user-admin");
    assert.equal(entries[0].action, "source.create");
    assert.equal(entries[0].target, undefined);
  } finally {
    close();
  }
});

test("rejected writes are not audited", async () => {
  const { env, db, close, tokenFor } = await setup();
  try {
    const token = await tokenFor("editor");
    const response = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY, token)),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 403);
    const entries = await listAuditLog(db);
    assert.equal(entries.length, 0);
  } finally {
    close();
  }
});

test("all five write endpoints require auth", async () => {
  const { env, close, tokenFor } = await setup();
  try {
    const adminToken = await tokenFor("admin");
    const created = await worker.fetch(
      request("/sources", jsonInit(SOURCE_BODY, adminToken)),
      env,
      context() as unknown as ExecutionContext,
    );
    const source = (await created.json()) as SourceRecord;
    const attempts: Array<[string, RequestInit]> = [
      [
        `/sources/${source.id}/allow-status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ allowStatus: "approved" }),
        },
      ],
      [`/sources/${source.id}`, { method: "DELETE" }],
      [
        `/sources/${source.id}/feeds`,
        jsonInit({
          url: "https://example.com/feed.xml",
          format: "rss",
        }),
      ],
      [
        `/feeds/feed-1`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enabled: false }),
        },
      ],
    ];
    for (const [path, init] of attempts) {
      const response = await worker.fetch(
        request(path, init),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 401, path);
    }
  } finally {
    close();
  }
});

test("reader GET endpoints stay public without a token", async () => {
  const { env, close } = await setup();
  try {
    for (const path of [
      "/healthz",
      "/raw-items",
      "/recommendations",
      "/sources",
      "/sources/missing",
      "/articles/missing",
    ]) {
      const response = await worker.fetch(
        request(path),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.notEqual(response.status, 401, path);
      assert.notEqual(response.status, 403, path);
    }
  } finally {
    close();
  }
});

test("write requests over the per-minute budget get 429", async () => {
  const { env, db, close, tokenFor } = await setup();
  try {
    const token = await tokenFor("admin");
    const ip = "203.0.113.7";
    const window = minuteWindow(Date.now());
    await db
      .prepare(
        "INSERT INTO rate_limits (ip, window, count) VALUES (?, ?, 60)",
      )
      .bind(ip, window)
      .run();
    const response = await worker.fetch(
      request("/sources", {
        ...jsonInit(SOURCE_BODY, token),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-for": ip,
        },
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 429);
    const body = (await response.json()) as ApiErrorResponse;
    assert.equal(body.error.code, "RATE_LIMITED");
  } finally {
    close();
  }
});

test("write requests within the budget pass and the cap blocks", async () => {
  const { env, db, close, tokenFor } = await setup();
  try {
    const token = await tokenFor("admin");
    const withinIp = "203.0.113.8";
    const window = minuteWindow(Date.now());
    await db
      .prepare(
        "INSERT INTO rate_limits (ip, window, count) VALUES (?, ?, 59)",
      )
      .bind(withinIp, window)
      .run();
    const within = await worker.fetch(
      request("/sources", {
        ...jsonInit(SOURCE_BODY, token),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-for": withinIp,
        },
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(within.status, 201);
    const cappedIp = "203.0.113.9";
    await db
      .prepare(
        "INSERT INTO rate_limits (ip, window, count) VALUES (?, ?, 60)",
      )
      .bind(cappedIp, window)
      .run();
    const capped = await worker.fetch(
      request("/sources", {
        ...jsonInit(SOURCE_BODY, token),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
          "x-forwarded-for": cappedIp,
        },
      }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(capped.status, 429);
  } finally {
    close();
  }
});

test("rateLimit middleware blocks the 61st request then resets on the next window", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const env = {
      DB: db,
      ENVIRONMENT: "test",
      LOG_LEVEL: "error",
    } as unknown as Env;
    const baseTime = Date.parse(
      "2026-10-10T00:00:30.000Z",
    );
    let clockNow = baseTime;
    const sandbox = new Hono<{
      Bindings: Env;
      Variables: Record<string, never>;
    }>();
    sandbox.post(
      "/write",
      rateLimit({ clock: () => clockNow }),
      (c) => c.json({ ok: true }),
    );
    const init = {
      method: "POST",
      headers: { "cf-connecting-ip": "198.51.100.9" },
    };
    for (let index = 0; index < 60; index += 1) {
      const response = await sandbox.fetch(
        new Request("https://api.example.com/write", init),
        env,
      );
      assert.equal(response.status, 200, `request ${index + 1}`);
    }
    const blocked = await sandbox.fetch(
      new Request("https://api.example.com/write", init),
      env,
    );
    assert.equal(blocked.status, 429);
    clockNow = baseTime + 61_000;
    const reset = await sandbox.fetch(
      new Request("https://api.example.com/write", init),
      env,
    );
    assert.equal(reset.status, 200);
  } finally {
    close();
  }
});
