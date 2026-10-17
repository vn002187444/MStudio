import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database, R2Bucket, R2Object } from "@cloudflare/workers-types";
import type { RawItemRecord } from "@mstudio/contracts";
import { CATEGORY_FALLBACK_IMAGES } from "@mstudio/contracts";
import {
  createFeed,
  createRawItem,
  createSession,
  createSource,
  getArticle,
  getRawItem,
  getRevision,
  getStory,
  listAgentRunsByStory,
  listArticlesByStory,
  listAuditLog,
  listRevisions,
  listStories,
  listStorySources,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import { createLogger } from "@mstudio/observability";
import {
  GeminiAdapter,
  ModelGateway,
  ModelGatewayError,
  type ModelProvider,
  type ModelResponse,
} from "@mstudio/model-gateway";
import worker from "./index.ts";
import {
  acceptRawItem,
  buildDraftGateway,
  generateSlug,
  inferCategorySlug,
  rejectRawItem,
  RawItemDecisionConflictError,
} from "./accept.ts";

const NOW = "2026-01-01T00:00:00.000Z";

const AI_OUTPUT = JSON.stringify({
  summary: "Two independent sources confirm the headline.",
  facts: [
    {
      text: "The event happened on Monday",
      sourceRefs: [{ sourceId: "source-1" }],
    },
  ],
  claims: [
    {
      text: "The budget passed",
      sourceRefs: [{ sourceId: "source-1" }],
      confidence: 0.7,
    },
  ],
});

interface TestContext {
  waitUntil(): void;
}

function context(): TestContext {
  return { waitUntil: () => {} };
}

async function seedRawItem(db: D1Database): Promise<RawItemRecord> {
  await createSource(db, {
    id: "source-1",
    name: "Example News",
    originUrl: "https://example.com",
    kind: "rss",
    now: NOW,
  });
  await createFeed(db, {
    id: "feed-1",
    sourceId: "source-1",
    url: "https://example.com/feed.xml",
    format: "rss",
    now: NOW,
  });
  const { row } = await createRawItem(db, {
    id: "raw-1",
    feedId: "feed-1",
    sourceId: "source-1",
    url: "https://example.com/article-1",
    title: "Article headline",
    fetchedAt: NOW,
    payloadHash: "hash-raw-1",
  });
  return row;
}

async function createToken(
  db: D1Database,
  role: "admin" | "editor" | "reviewer" | "seo" | "analyst",
): Promise<string> {
  const { token } = await createSession(db, {
    userId: `${role}-user`,
    role,
    expiresAt: "2099-01-01T00:00:00.000Z",
  });
  return token;
}

function buildEnv(
  db: D1Database,
  overrides: Record<string, unknown> = {},
): Env {
  return {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
    ...overrides,
  } as unknown as Env;
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

function fakeRawBucket(content: string): R2Bucket {
  const object = {
    async text(): Promise<string> {
      return content;
    },
  } as unknown as R2Object;
  return {
    async get(): Promise<R2Object | null> {
      return object;
    },
  } as unknown as R2Bucket;
}

type Step =
  | { kind: "text"; text: string }
  | { kind: "error"; error: unknown };

function mockGateway(steps: Step[]): {
  gateway: ModelGateway;
  calls: () => number;
} {
  let index = 0;
  const provider: ModelProvider = {
    async generate(): Promise<ModelResponse> {
      const step = steps[Math.min(index, steps.length - 1)];
      index += 1;
      if (step.kind === "error") throw step.error;
      return {
        text: step.text,
        model: "test-model",
        finishReason: "STOP",
        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      };
    },
  };
  return { gateway: new ModelGateway({ provider }), calls: () => index };
}

test("POST /raw-items/:id/accept creates story, article and revision", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    const response = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      storyId: string;
      articleId: string;
      revisionId: string;
      draftSource: string;
      created: boolean;
    };
    assert.equal(body.created, true);
    assert.equal(body.draftSource, "raw");
    assert.equal(body.storyId.length > 0, true);
    assert.equal(body.articleId.length > 0, true);
    assert.equal(body.revisionId.length > 0, true);

    const story = await getStory(db, body.storyId);
    assert.equal(story?.title, "Article headline");
    assert.equal(story?.status, "draft");

    const article = await getArticle(db, body.articleId);
    assert.equal(article?.storyId, body.storyId);
    assert.equal(article?.status, "drafted");
    assert.equal(article?.currentRevisionId, body.revisionId);

    const revision = await getRevision(db, body.revisionId);
    assert.equal(revision?.articleId, body.articleId);
    assert.equal(revision?.revisionNumber, 1);
    assert.equal(revision?.title, "Article headline");
    assert.equal(
      revision?.body?.includes("Nguồn: Example News (https://example.com)"),
      true,
    );
    assert.equal(
      revision?.body?.includes("Original: https://example.com/article-1"),
      true,
    );

    const sources = await listStorySources(db, body.storyId);
    assert.equal(sources.length, 1);
    assert.equal(sources[0].rawItemId, rawItem.id);
    assert.equal(sources[0].role, "primary");
  } finally {
    close();
  }
});

test("POST /raw-items/:id/accept is idempotent", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const editorToken = await createToken(db, "editor");
    const env = buildEnv(db);
    const first = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, editorToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      storyId: string;
      articleId: string;
      revisionId: string;
      created: boolean;
    };

    const second = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, editorToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(second.status, 200);
    const secondBody = (await second.json()) as {
      storyId: string;
      articleId: string;
      revisionId: string;
      created: boolean;
    };
    assert.equal(secondBody.created, false);
    assert.equal(secondBody.storyId, firstBody.storyId);
    assert.equal(secondBody.articleId, firstBody.articleId);
    assert.equal(secondBody.revisionId, firstBody.revisionId);

    assert.equal((await listStories(db)).rows.length, 1);
    assert.equal(
      (await listArticlesByStory(db, firstBody.storyId)).rows
        .length,
      1,
    );
    assert.equal(
      (await listRevisions(db, firstBody.articleId)).length,
      1,
    );
  } finally {
    close();
  }
});

test("accept uses raw item content from R2 when present", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db, {
      RAW_BUCKET: fakeRawBucket("Full raw article body from the feed."),
    });
    const response = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const body = (await response.json()) as { revisionId: string };
    const revision = await getRevision(db, body.revisionId);
    assert.equal(
      revision?.body?.includes("Full raw article body from the feed."),
      true,
    );
    assert.equal(
      revision?.body?.includes("Nguồn: Example News (https://example.com)"),
      true,
    );
  } finally {
    close();
  }
});

test("POST /raw-items/:id/reject discards raw item and audits", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const reviewerToken = await createToken(db, "reviewer");
    const env = buildEnv(db);
    const response = await worker.fetch(
      request(`/raw-items/${rawItem.id}/reject`, { method: "POST" }, reviewerToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 201);
    const body = (await response.json()) as {
      rawItemId: string;
      status: string;
      created: boolean;
    };
    assert.equal(body.rawItemId, rawItem.id);
    assert.equal(body.status, "discarded");
    assert.equal(body.created, true);

    const discarded = await getRawItem(db, rawItem.id);
    assert.equal(discarded?.status, "discarded");

    const audit = await listAuditLog(db);
    const entry = audit.find(
      (row) => row.action === "raw-item.reject" && row.target === rawItem.id,
    );
    assert.equal(entry?.actor, "reviewer-user");
  } finally {
    close();
  }
});

test("reject is idempotent", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    const path = `/raw-items/${rawItem.id}/reject`;
    const first = await worker.fetch(
      request(path, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const second = await worker.fetch(
      request(path, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    const body = (await second.json()) as { created: boolean };
    assert.equal(body.created, false);
  } finally {
    close();
  }
});

test("accept after reject returns 409", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    await worker.fetch(
      request(`/raw-items/${rawItem.id}/reject`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const response = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "DECISION_CONFLICT");
  } finally {
    close();
  }
});

test("reject after accept returns 409", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    const response = await worker.fetch(
      request(`/raw-items/${rawItem.id}/reject`, { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "DECISION_CONFLICT");
  } finally {
    close();
  }
});

test("accept requires Editor+ role", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const env = buildEnv(db);

    const unauthenticated = await worker.fetch(
      request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(unauthenticated.status, 401);

    for (const role of ["seo", "analyst"] as const) {
      const token = await createToken(db, role);
      const response = await worker.fetch(
        request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, token),
        env,
        context() as unknown as ExecutionContext,
      );
      assert.equal(response.status, 403);
    }

    for (const role of ["editor", "reviewer"] as const) {
      const token = await createToken(db, role);
      const response = await worker.fetch(
        request(`/raw-items/${rawItem.id}/accept`, { method: "POST" }, token),
        env,
        context() as unknown as ExecutionContext,
      );
      // First accept creates (201); the second replays idempotently (200).
      assert.equal(response.status < 300, true);
    }
  } finally {
    close();
  }
});

test("accept unknown raw item returns 404", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    const response = await worker.fetch(
      request("/raw-items/missing/accept", { method: "POST" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(response.status, 404);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "RAW_ITEM_NOT_FOUND");
  } finally {
    close();
  }
});

test("non-POST on accept/reject routes returns 405", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const adminToken = await createToken(db, "admin");
    const env = buildEnv(db);
    const accept = await worker.fetch(
      request("/raw-items/raw-1/accept", { method: "GET" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(accept.status, 405);
    const reject = await worker.fetch(
      request("/raw-items/raw-1/reject", { method: "GET" }, adminToken),
      env,
      context() as unknown as ExecutionContext,
    );
    assert.equal(reject.status, 405);
  } finally {
    close();
  }
});

test("acceptRawItem uses AI draft when gateway is provided", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const { gateway, calls } = mockGateway([{ kind: "text", text: AI_OUTPUT }]);
    const result = await acceptRawItem(
      {
        db,
        gateway,
        actor: "editor-1",
        now: NOW,
        logger: createLogger({
          environment: "test",
          logLevel: "error",
        }),
      },
      rawItem,
    );
    assert.equal(result.created, true);
    assert.equal(result.draftSource, "ai");
    assert.equal(calls(), 1);

    const revision = await getRevision(db, result.revisionId);
    assert.equal(revision?.summary, "Two independent sources confirm the headline.");
    assert.equal(revision?.body?.includes("The event happened on Monday"), true);
    assert.equal(revision?.body?.includes("source: source-1"), true);
    assert.equal(revision?.body?.includes("The budget passed"), true);
    assert.equal(
      revision?.body?.includes("Nguồn: Example News (https://example.com)"),
      true,
    );

    const runs = await listAgentRunsByStory(db, result.storyId);
    assert.equal(runs.rows.length, 1);
    assert.equal(runs.rows[0].status, "succeeded");
    assert.equal(runs.rows[0].model, "gemini-3.1-flash-lite");
  } finally {
    close();
  }
});

test("acceptRawItem falls back to raw draft when the model fails", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const { gateway, calls } = mockGateway([
      {
        kind: "error",
        error: new ModelGatewayError("gemini returned HTTP 429", "PROVIDER_ERROR"),
      },
    ]);
    const result = await acceptRawItem(
      {
        db,
        gateway,
        actor: "editor-1",
        now: NOW,
        logger: createLogger({
          environment: "test",
          logLevel: "error",
        }),
      },
      rawItem,
    );
    assert.equal(result.draftSource, "raw");
    assert.equal(calls(), 3);

    const revision = await getRevision(db, result.revisionId);
    assert.equal(revision?.title, "Article headline");
    assert.equal(
      revision?.body?.includes("Nguồn: Example News (https://example.com)"),
      true,
    );

    const runs = await listAgentRunsByStory(db, result.storyId);
    assert.equal(runs.rows.length, 1);
    assert.equal(runs.rows[0].status, "failed");
    assert.equal(runs.rows[0].errorCode, "PROVIDER_ERROR");
  } finally {
    close();
  }
});

test("rejectRawItem service is idempotent and conflicts with accepted items", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const rawItem = await seedRawItem(db);
    const first = await rejectRawItem(
      { db, actor: "editor-1", now: NOW },
      rawItem,
    );
    assert.equal(first.created, true);
    assert.equal(first.status, "discarded");
    const second = await rejectRawItem(
      { db, actor: "editor-1", now: NOW },
      rawItem,
    );
    assert.equal(second.created, false);

    await assert.rejects(
      acceptRawItem({ db, actor: "editor-1", now: NOW }, rawItem),
      RawItemDecisionConflictError,
    );
  } finally {
    close();
  }
});

test("buildDraftGateway reads GEMINI_API_KEY from env", () => {
  assert.equal(buildDraftGateway({}), undefined);
  assert.equal(buildDraftGateway({ GEMINI_API_KEY: "   " }), undefined);
  const gateway = buildDraftGateway({ GEMINI_API_KEY: "test-key" });
  assert.equal(gateway instanceof ModelGateway, true);
  assert.equal(
    gateway instanceof ModelGateway &&
      gateway["provider"] instanceof GeminiAdapter,
    true,
  );
});

test("generateSlug decodes HTML entities before generating slug", () => {
  const rawTitle =
    "Chủ tịch FIFA xin lỗi, c&ocirc;ng bố mỗi li&ecirc;n đo&agrave;n nhận 25 triệu USD, c&oacute; Việt Nam";
  const slug = generateSlug(rawTitle);
  assert.equal(
    slug,
    "chu-tich-fifa-xin-loi-cong-bo-moi-lien-doan-nhan-25-trieu-usd-co-viet-nam",
  );
});

test("acceptRawItem preserves imageUrl as heroImageUrl on article", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createSource(db, {
      id: "source-image",
      name: "Source with image",
      originUrl: "https://example.com",
      kind: "rss",
      now: NOW,
    });
    await createFeed(db, {
      id: "feed-image",
      sourceId: "source-image",
      url: "https://example.com/feed",
      format: "rss",
      now: NOW,
    });
    const { row: rawItem } = await createRawItem(db, {
      id: "item-image-1",
      feedId: "feed-image",
      sourceId: "source-image",
      url: "https://example.com/article-with-image",
      title: "Article with hero image",
      fetchedAt: NOW,
      payloadHash: "hash-img-1",
      imageUrl: "https://example.com/hero.jpg",
    });

    const result = await acceptRawItem(
      { db, actor: "editor-1", now: NOW },
      rawItem,
    );

    const article = await getArticle(db, result.articleId);
    assert.equal(article?.heroImageUrl, "https://example.com/hero.jpg");
  } finally {
    close();
  }
});

test("acceptRawItem falls back to the category image when imageUrl is missing", async () => {
  const { db, close } = await openMigratedTestDb();
  const expected = CATEGORY_FALLBACK_IMAGES["cong-nghe"];
  try {
    await createSource(db, {
      id: "source-noimage",
      name: "Source without image",
      originUrl: "https://example.com",
      kind: "rss",
      now: NOW,
    });
    await createFeed(db, {
      id: "feed-noimage",
      sourceId: "source-noimage",
      url: "https://example.com/feed",
      format: "rss",
      now: NOW,
    });
    const { row: rawItem } = await createRawItem(db, {
      id: "item-noimage-1",
      feedId: "feed-noimage",
      sourceId: "source-noimage",
      url: "https://example.com/article-without-image",
      title: "Article without hero image",
      fetchedAt: NOW,
      payloadHash: "hash-noimg-1",
    });

    const result = await acceptRawItem(
      { db, actor: "editor-1", now: NOW },
      rawItem,
    );

    const article = await getArticle(db, result.articleId);
    assert.equal(article?.heroImageUrl, expected);
    assert.equal(article?.ogImageUrl, expected);
  } finally {
    close();
  }
});

test("inferCategorySlug does not match short keywords as substrings", () => {
  assert.equal(
    inferCategorySlug("Tai nạn giao thông nghiêm trọng trên quốc lộ", ""),
    "doi-song",
  );
  assert.equal(
    inferCategorySlug("Xem phim bom tấn cuối tuần này", ""),
    "giai-tri",
  );
  assert.equal(
    inferCategorySlug("Chứng khoán giảm mạnh phiên đầu tuần", ""),
    "kinh-doanh",
  );
  assert.equal(
    inferCategorySlug("Tổng thống Nga thăm Trung Quốc", ""),
    "the-gioi",
  );
  assert.equal(
    inferCategorySlug("Hà Nội siết giao dịch nhà đất 2 giá", ""),
    "kinh-doanh",
  );
});

test("inferCategorySlug classifies English articles by topic", () => {
  assert.equal(
    inferCategorySlug(
      "Trump's diesel deal with Putin draws criticism from a frustrated Congress",
      "",
    ),
    "the-gioi",
  );
  assert.equal(
    inferCategorySlug("OpenAI unveils a new artificial intelligence model", ""),
    "cong-nghe",
  );
  assert.equal(
    inferCategorySlug("Fed holds interest rate steady as inflation cools", ""),
    "kinh-doanh",
  );
  assert.equal(
    inferCategorySlug("Câu lạc bộ bóng đá thắng trận chung kết", ""),
    "the-thao",
  );
  assert.equal(
    inferCategorySlug("Một bài viết về ẩm thực và du lịch", ""),
    "cong-nghe",
  );
});

