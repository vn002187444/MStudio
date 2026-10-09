import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import {
  addRevision,
  createArticle,
  createStory,
  getArticle,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import worker from "./index.ts";

const NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-01-01T00:00:01.000Z";

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
    SITE_URL: "https://news.example.com",
  } as unknown as Env;
  return { env, db, close };
}

function request(path: string, init?: RequestInit): Request {
  return new Request(`https://publish.example.com${path}`, init);
}

function jsonInit(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

async function seedScheduledArticle(
  db: D1Database,
): Promise<{ articleId: string; revisionId: string }> {
  await createStory(db, { id: "story-1", title: "Story", now: NOW });
  const article = await createArticle(db, {
    id: "article-1",
    storyId: "story-1",
    status: "scheduled",
    now: NOW,
  });
  const revision = await addRevision(db, {
    id: "rev-1",
    articleId: article.id,
    title: "Ready",
    body: "Body",
    now: NOW,
  });
  return { articleId: article.id, revisionId: revision.id };
}

test("GET /healthz reports ok", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/healthz"),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean };
    assert.equal(body.ok, true);
  } finally {
    close();
  }
});

test("publish is idempotent over HTTP", async () => {
  const { env, db, close } = await setup();
  try {
    const { articleId, revisionId } = await seedScheduledArticle(db);
    const ctx = {
      waitUntil: () => {},
    } as unknown as ExecutionContext;

    const first = await worker.fetch(
      request(`/articles/${articleId}/publish`, jsonInit({ revisionId })),
      env,
      ctx,
    );
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      alreadyPublished: boolean;
      article: { status: string; publishedRevisionId: string };
      sitemapEvent?: {
        kind: string;
        url: string;
        lastmod: string;
      };
    };
    assert.equal(firstBody.alreadyPublished, false);
    assert.equal(firstBody.article.status, "published");
    assert.equal(firstBody.article.publishedRevisionId, revisionId);
    assert.equal(firstBody.sitemapEvent?.kind, "article_published");
    assert.equal(
      firstBody.sitemapEvent?.url,
      `https://news.example.com/articles/${articleId}`,
    );
    assert.ok(firstBody.sitemapEvent?.lastmod);

    const second = await worker.fetch(
      request(`/articles/${articleId}/publish`, jsonInit({ revisionId })),
      env,
      ctx,
    );
    assert.equal(second.status, 200);
    const secondBody = (await second.json()) as {
      alreadyPublished: boolean;
    };
    assert.equal(secondBody.alreadyPublished, true);

    const article = await getArticle(db, articleId);
    assert.equal(article?.status, "published");
    assert.equal(article?.publishKey, `${articleId}:${revisionId}`);
  } finally {
    close();
  }
});

test("publish from draft is rejected by the review gate", async () => {
  const { env, db, close } = await setup();
  try {
    await createStory(db, { id: "story-1", title: "Story", now: NOW });
    const article = await createArticle(db, {
      id: "article-1",
      storyId: "story-1",
      status: "drafted",
      now: NOW,
    });
    const revision = await addRevision(db, {
      id: "rev-1",
      articleId: article.id,
      title: "Draft",
      body: "Body",
      now: NOW,
    });
    const response = await worker.fetch(
      request(`/articles/${article.id}/publish`, jsonInit({ revisionId: revision.id })),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "NOT_SCHEDULED");
    const unchanged = await getArticle(db, article.id);
    assert.equal(unchanged?.status, "drafted");
  } finally {
    close();
  }
});

test("invalid transition returns 409 with allowed targets", async () => {
  const { env, db, close } = await setup();
  try {
    await createStory(db, { id: "story-1", title: "Story", now: NOW });
    const article = await createArticle(db, {
      id: "article-1",
      storyId: "story-1",
      status: "drafted",
      now: NOW,
    });
    const response = await worker.fetch(
      request(
        `/articles/${article.id}/transitions`,
        jsonInit({ to: "published" }),
      ),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 409);
    const body = (await response.json()) as {
      error: { code: string; details: { allowed: string[] } };
    };
    assert.equal(body.error.code, "INVALID_TRANSITION");
    assert.deepEqual(body.error.details.allowed, ["ai_qa"]);
  } finally {
    close();
  }
});

test("valid transition advances status over HTTP", async () => {
  const { env, db, close } = await setup();
  try {
    await createStory(db, { id: "story-1", title: "Story", now: NOW });
    const article = await createArticle(db, {
      id: "article-1",
      storyId: "story-1",
      status: "drafted",
      now: NOW,
    });
    const ctx = {
      waitUntil: () => {},
    } as unknown as ExecutionContext;
    const response = await worker.fetch(
      request(
        `/articles/${article.id}/transitions`,
        jsonInit({ to: "ai_qa" }),
      ),
      env,
      ctx,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string };
    assert.equal(body.status, "ai_qa");
  } finally {
    close();
  }
});

test("transition rejects non-status value", async () => {
  const { env, db, close } = await setup();
  try {
    await createStory(db, { id: "story-1", title: "Story", now: NOW });
    const article = await createArticle(db, {
      id: "article-1",
      storyId: "story-1",
      status: "drafted",
      now: NOW,
    });
    const response = await worker.fetch(
      request(
        `/articles/${article.id}/transitions`,
        jsonInit({ to: "bogus" }),
      ),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "VALIDATION_FAILED");
  } finally {
    close();
  }
});

test("GET /articles/:id returns article and revision history", async () => {
  const { env, db, close } = await setup();
  try {
    const { articleId } = await seedScheduledArticle(db);
    const response = await worker.fetch(
      request(`/articles/${articleId}`),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      article: { id: string };
      revisions: Array<{ revisionNumber: number }>;
    };
    assert.equal(body.article.id, articleId);
    assert.equal(body.revisions.length, 1);
    assert.equal(body.revisions[0].revisionNumber, 1);
  } finally {
    close();
  }
});

test("GET /articles/:id returns 404 when missing", async () => {
  const { env, close } = await setup();
  try {
    const response = await worker.fetch(
      request("/articles/missing"),
      env,
      { waitUntil: () => {} } as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "ARTICLE_NOT_FOUND");
  } finally {
    close();
  }
});
