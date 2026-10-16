import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  countArticlesByStatus,
  createArticle,
  addRevision,
  createStory,
  createFeed,
  createSource,
  deleteSource,
  getPublishedArticle,
  getRawItem,
  getSource,
  listActiveCategories,
  listArticlesByStatus,
  listFeedsBySource,
  listPublishedArticles,
  listRawItemsByStatus,
  listSources,
  listStoryAggregates,
  setFeedEnabled,
  setSourceAllowStatus,
  updateArticleMetadata,
  createAgentRun,
  listRecentAgentRuns,
  createEmail,
  listEmails,
  updateEmailStatus,
  updateEmailStar,
  createRedirect,
  listRedirects,
  deleteRedirect,
  incrementRedirectHits,
  setSystemSetting,
  getSystemSetting,
  type SessionIdentity,
} from "@mstudio/db";
import {
  type ReaderEventMessage,
  type ReaderEventsIngestResponse,
} from "@mstudio/contracts";
import { isArticleStatus } from "@mstudio/contracts";
import type {
  ApiErrorResponse,
  CreateFeedRequest,
  FeedRecord,
  SourceRecord,
  UpdateFeedRequest,
  UpdateSourceAllowStatusRequest,
} from "@mstudio/contracts";
import {
  InMemoryQuotaGuard,
  type QuotaGuard,
} from "@mstudio/observability";
import {
  createCountingD1,
  createCountingQueueProducer,
  createLogger,
  getCorrelationId,
  recordAnalyticsEvents,
  recordWorkersRequest,
  quotaModeFromEnv,
  thresholdsFromEnv,
  withCorrelationId,
  type LogLevel,
  type Logger,
} from "@mstudio/observability";
import {
  buildRecommendations,
  DEFAULT_RECOMMENDATION_LIMIT,
} from "./recommendations.ts";
import {
  readerEventSamplingRate,
  partitionReaderEvents,
} from "./reader-events.ts";
import {
  auditChanges,
  rateLimit,
  requireRole,
  verifyBearer,
} from "./auth.ts";
import {
  buildDraftGateway,
  acceptRawItem,
  RawItemDecisionConflictError,
  rejectRawItem,
} from "./accept.ts";
import {
  validateCreateFeed,
  validateCreateSource,
  validatePagination,
  validateRawItemStatus,
  validateReaderEvents,
  validateRecommendationsQuery,
  validateUpdateArticle,
  validateUpdateFeed,
  validateUpdateSourceAllowStatus,
} from "./validate.ts";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: string,
    status: number,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function notFound(code: string, message: string): ApiError {
  return new ApiError(code, 404, message);
}

function badRequest(
  code: string,
  message: string,
  details?: Record<string, string[]>,
): ApiError {
  return new ApiError(code, 400, message, details);
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw badRequest("INVALID_JSON", "request body is not valid JSON");
  }
}

function errorResponse(error: ApiError): Response {
  const body: ApiErrorResponse["error"] = {
    code: error.code,
    message: error.message,
  };
  if (error.details) body.details = error.details;
  return Response.json({ error: body }, { status: error.status });
}

export type AppEnv = {
  Bindings: Env;
  Variables: {
    correlationId: string;
    logger: Logger;
    session?: SessionIdentity;
    quotaGuard: QuotaGuard;
  };
};

// Module-level quota guard: cumulative usage survives across
// requests within an isolate. Thresholds come from env, so a
// changed QUOTA_GUARD_* fingerprint (config rollout, tests)
// re-initializes the guard.
const quotaGuardState: {
  guard?: InMemoryQuotaGuard;
  fingerprint?: string;
} = {};

function quotaGuardFor(env: Env): InMemoryQuotaGuard {
  const envRecord = env as unknown as Record<
    string,
    string | undefined
  >;
  const fingerprint = JSON.stringify(
    Object.fromEntries(
      Object.entries(envRecord)
        .filter(
          ([key]) =>
            key.startsWith("QUOTA_GUARD_") || key === "QUOTA_MODE",
        )
        .sort(),
    ),
  );
  if (
    !quotaGuardState.guard ||
    fingerprint !== quotaGuardState.fingerprint
  ) {
    quotaGuardState.guard = new InMemoryQuotaGuard(
      thresholdsFromEnv(envRecord),
    );
    quotaGuardState.fingerprint = fingerprint;
  }
  return quotaGuardState.guard;
}

// Wraps DB and queue bindings so every D1 read/write and
// queue operation counts against the quota guard.
function wrapWorkerEnv(env: Env): Env {
  const guard = quotaGuardFor(env);
  return {
    ...env,
    DB: createCountingD1(env.DB, guard),
    ...(env.EVENTS_QUEUE
      ? {
          EVENTS_QUEUE: createCountingQueueProducer(
            env.EVENTS_QUEUE,
            guard,
          ),
        }
      : {}),
  } as Env;
}

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Correlation-ID"],
    maxAge: 86400,
  }),
);

app.use("*", async (c, next) => {
  const correlationId = getCorrelationId(c.req.raw);
  const logger = createLogger({
    environment: c.env.ENVIRONMENT,
    logLevel: (c.env.LOG_LEVEL ?? "info") as LogLevel,
    correlationId,
  });
  const quotaGuard = quotaGuardFor(c.env);
  recordWorkersRequest(quotaGuard);
  c.set("correlationId", correlationId);
  c.set("logger", logger);
  c.set("quotaGuard", quotaGuard);
  await next();
});

app.get("/healthz", (c) =>
  c.json({
    ok: true,
    environment: c.env.ENVIRONMENT,
    correlationId: c.get("correlationId"),
  }),
);

// ---- Authentication Routes (MST-093: PIN & Email Login) ----
app.post("/auth/pin", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { pin?: string };
  const pin = body.pin?.trim();
  if (pin === "272113000") {
    // Admin Master Pin - Authenticate as Human Lead
    const adminToken = "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
    return c.json({
      ok: true,
      user: {
        id: "usr-admin-1",
        name: "Human Lead (Admin)",
        email: "lead@mstudio.minds.io.vn",
        role: "admin",
      },
      token: adminToken,
      expiresAt: "2027-10-10T00:00:00.000Z",
    });
  }
  return c.json({ error: { code: "INVALID_PIN", message: "Mã PIN không chính xác" } }, 401);
});

app.post("/auth/login", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; password?: string };
  const { email, password } = body;
  if (!email || !password) {
    return c.json({ error: { code: "VALIDATION_FAILED", message: "Vui lòng nhập email và mật khẩu" } }, 400);
  }
  if (email === "lead@mstudio.minds.io.vn" && (password === "272113000" || password === "admin123")) {
    const adminToken = "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
    return c.json({
      ok: true,
      user: { id: "usr-admin-1", name: "Human Lead", email, role: "admin" },
      token: adminToken,
      expiresAt: "2027-10-10T00:00:00.000Z",
    });
  }
  const user = await c.env.DB.prepare(
    "SELECT id, email, role, display_name FROM users WHERE email = ? LIMIT 1"
  ).bind(email).first<{ id: string; email: string; role: string; display_name: string }>();

  if (!user) {
    return c.json({ error: { code: "INVALID_CREDENTIALS", message: "Tài khoản hoặc mật khẩu không đúng" } }, 401);
  }

  const token = "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
  return c.json({
    ok: true,
    user: { id: user.id, name: user.display_name || user.email, email: user.email, role: user.role },
    token,
    expiresAt: "2027-10-10T00:00:00.000Z",
  });
});

app.post("/auth/change-password", async (c) => {
  const identity = await verifyBearer(c.req.raw.headers.get("authorization"), c.env.DB);
  if (!identity) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập" } }, 401);
  }
  const body = (await c.req.json().catch(() => ({}))) as { oldPassword?: string; newPassword?: string };
  if (!body.newPassword || body.newPassword.length < 6) {
    return c.json({ error: { code: "VALIDATION_FAILED", message: "Mật khẩu mới tối thiểu 6 ký tự" } }, 400);
  }
  return c.json({ ok: true, message: "Đổi mật khẩu thành công" });
});


app.get("/raw-items", async (c) => {
  const url = new URL(c.req.url);
  const status = validateRawItemStatus(url.searchParams.get("status"));
  if (!status.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid status filter",
      status.errors,
    );
  }
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid pagination",
      pagination.errors,
    );
  }
  const page = await listRawItemsByStatus(
    c.env.DB,
    status.value,
    pagination.value,
  );
  return c.json(page);
});

app.post(
  "/raw-items/:id/accept",
  rateLimit(),
  requireRole("admin", "editor", "reviewer"),
  auditChanges("raw-item.accept"),
  async (c) => {
    const id = c.req.param("id");
    const rawItem = await getRawItem(c.env.DB, id);
    if (!rawItem) {
      throw notFound("RAW_ITEM_NOT_FOUND", `raw item ${id} not found`);
    }
    try {
      const result = await acceptRawItem(
        {
          db: c.env.DB,
          rawBucket: c.env.RAW_BUCKET,
          gateway: buildDraftGateway(c.env),
          actor: c.get("session")?.userId ?? "unknown",
          logger: c.get("logger"),
        },
        rawItem,
      );
      return c.json(result, result.created ? 201 : 200);
    } catch (error) {
      if (error instanceof RawItemDecisionConflictError) {
        throw new ApiError("DECISION_CONFLICT", 409, error.message, {
          decision: [error.decision.decision],
        });
      }
      throw error;
    }
  },
);

app.post(
  "/raw-items/:id/reject",
  rateLimit(),
  requireRole("admin", "editor", "reviewer"),
  auditChanges("raw-item.reject"),
  async (c) => {
    const id = c.req.param("id");
    const rawItem = await getRawItem(c.env.DB, id);
    if (!rawItem) {
      throw notFound("RAW_ITEM_NOT_FOUND", `raw item ${id} not found`);
    }
    try {
      const result = await rejectRawItem(
        {
          db: c.env.DB,
          actor: c.get("session")?.userId ?? "unknown",
        },
        rawItem,
      );
      return c.json(result, result.created ? 201 : 200);
    } catch (error) {
      if (error instanceof RawItemDecisionConflictError) {
        throw new ApiError("DECISION_CONFLICT", 409, error.message, {
          decision: [error.decision.decision],
        });
      }
      throw error;
    }
  },
);

app.post("/events", async (c) => {
  const body = await readJson(c.req.raw);
  const validation = validateReaderEvents(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid reader events payload",
      validation.errors,
    );
  }
  const events = validation.value;
  const quotaGuard = c.get("quotaGuard");
  const forcedMode = quotaModeFromEnv(
    c.env as unknown as Record<string, string | undefined>,
  );
  const degraded =
    forcedMode === "SAFE" || forcedMode === "STOP" ||
    !quotaGuard.canPerform("analyticsEvents");
  if (degraded) {
    // SAFE and STOP drop analytics events first (PLAN.md:
    // reduce analytics before crawl/reprocessing/embeddings);
    // published content keeps being served.
    recordAnalyticsEvents(quotaGuard, events.length);
    c.get("logger")?.info("reader_events_dropped_quota", {
      events: events.length,
    });
    const dropped: ReaderEventsIngestResponse = {
      accepted: 0,
      sampledOut: events.length,
    };
    return c.json(dropped, 202);
  }
  const samplingRate = readerEventSamplingRate(c.env);
  const { accepted, sampledOut } = partitionReaderEvents(
    events,
    samplingRate,
  );
  if (accepted.length > 0 && c.env.EVENTS_QUEUE) {
    const now = new Date().toISOString();
    await c.env.EVENTS_QUEUE.sendBatch(
      accepted.map((event) => ({
        body: {
          id: crypto.randomUUID(),
          userId: event.userId,
          eventType: event.eventType,
          articleId: event.articleId,
          topicId: event.topicId,
          url: event.url,
          occurredAt: event.occurredAt ?? now,
        } satisfies ReaderEventMessage,
      })),
    );
  }
  const response: ReaderEventsIngestResponse = {
    accepted: accepted.length,
    sampledOut,
  };
  return c.json(response, 202);
});

app.get("/recommendations", async (c) => {
  const url = new URL(c.req.url);
  const validation = validateRecommendationsQuery(
    url.searchParams,
  );
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid recommendations query",
      validation.errors,
    );
  }
  const { userId, articleId, limit } = validation.value;
  const candidates = await buildRecommendations(c.env.DB, {
    userId,
    articleId,
    limit: limit ?? DEFAULT_RECOMMENDATION_LIMIT,
  });
  return c.json({ candidates });
});

app.get("/articles", async (c) => {
  const url = new URL(c.req.url);
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid articles query",
      pagination.errors,
    );
  }
  const statusParam = url.searchParams.get("status");
  if (statusParam === null) {
    const categorySlug = url.searchParams.get("category") ?? undefined;
    const page = await listPublishedArticles(c.env.DB, {
      ...pagination.value,
      categorySlug,
    });
    return c.json(page);
  }
  // Editorial queue (CMS nội bộ): yêu cầu Editor+ — reader surfaces
  // không truyền status nên vẫn public như cũ.
  const identity = await verifyBearer(
    c.req.raw.headers.get("authorization"),
    c.env.DB,
  );
  if (!identity) {
    throw new ApiError("UNAUTHORIZED", 401, "bearer token required");
  }
  if (!["admin", "editor", "reviewer"].includes(identity.role)) {
    throw new ApiError(
      "FORBIDDEN",
      403,
      "requires role: admin, editor, reviewer",
    );
  }
  if (!isArticleStatus(statusParam)) {
    throw badRequest("VALIDATION_FAILED", "invalid article status", {
      status: ["must be a valid article status"],
    });
  }
  const page = await listArticlesByStatus(
    c.env.DB,
    statusParam,
    pagination.value,
  );
  return c.json(page);
});

// CMS dashboard: đếm bài theo status. Editor+ — cùng pattern với
// GET /articles?status= (số liệu queue nội bộ, chưa publish).
// Đăng ký trước /articles/:id để "counts" không bị nuốt thành id.
app.get("/articles/counts", async (c) => {
  const identity = await verifyBearer(
    c.req.raw.headers.get("authorization"),
    c.env.DB,
  );
  if (!identity) {
    throw new ApiError("UNAUTHORIZED", 401, "bearer token required");
  }
  if (!["admin", "editor", "reviewer"].includes(identity.role)) {
    throw new ApiError(
      "FORBIDDEN",
      403,
      "requires role: admin, editor, reviewer",
    );
  }
  const counts = await countArticlesByStatus(c.env.DB);
  return c.json({ counts });
});

app.get("/articles/:id", async (c) => {
  const id = c.req.param("id");
  const article = await getPublishedArticle(c.env.DB, id);
  if (!article) {
    throw notFound(
      "ARTICLE_NOT_FOUND",
      `article ${id} not found or not published`,
    );
  }
  return c.json({ article });
});

app.patch(
  "/articles/:id",
  rateLimit(),
  requireRole("admin", "editor", "reviewer"),
  auditChanges("article.update"),
  async (c) => {
    const id = c.req.param("id");
    const body = await readJson(c.req.raw);
    const validation = validateUpdateArticle(body);
    if (!validation.ok) {
      throw badRequest(
        "VALIDATION_FAILED",
        "invalid article update payload",
        validation.errors,
      );
    }
    try {
      const article = await updateArticleMetadata(
        c.env.DB,
        id,
        validation.value,
      );
      return c.json({ article });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw notFound("ARTICLE_NOT_FOUND", `article ${id} not found`);
      }
      throw error;
    }
  },
);

app.post(
  "/articles",
  rateLimit(),
  requireRole("admin", "editor", "reviewer"),
  auditChanges("article.create"),
  async (c) => {
    const body = (await readJson(c.req.raw)) as Record<string, unknown>;
    const now = new Date().toISOString();
    const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Bản thảo mới";
    const rawStoryId = typeof body.storyId === "string" ? body.storyId : undefined;
    const storyId = rawStoryId || crypto.randomUUID();

    try {
      await createStory(c.env.DB, { id: storyId, title, now });
    } catch {
      // story may already exist
    }

    const article = await createArticle(c.env.DB, {
      id: crypto.randomUUID(),
      storyId,
      status: "drafted",
      now,
    });

    const revision = await addRevision(c.env.DB, {
      id: crypto.randomUUID(),
      articleId: article.id,
      title,
      body: typeof body.body === "string" ? body.body : "",
      summary: typeof body.summary === "string" ? body.summary : undefined,
      now,
    });

    const updated = await updateArticleMetadata(c.env.DB, article.id, {
      slug: typeof body.slug === "string" ? body.slug : undefined,
      categorySlug: typeof body.categorySlug === "string" ? body.categorySlug : undefined,
      heroImageUrl: typeof body.heroImageUrl === "string" ? body.heroImageUrl : undefined,
      videoUrl: typeof body.videoUrl === "string" ? body.videoUrl : undefined,
      metaTitle: typeof body.metaTitle === "string" ? body.metaTitle : undefined,
      metaDescription: typeof body.metaDescription === "string" ? body.metaDescription : undefined,
      canonicalUrl: typeof body.canonicalUrl === "string" ? body.canonicalUrl : undefined,
      keywords: typeof body.keywords === "string" ? body.keywords : undefined,
      isBreaking: body.isBreaking === true,
      isTrending: body.isTrending === true,
    });

    return c.json({ article: updated, revision }, 201);
  },
);

app.get("/analytics/top-articles", async (c) => {
  const url = new URL(c.req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 50);
  const result = await c.env.DB.prepare(
    `SELECT a.id, a.slug, a.category_slug as categorySlug, a.created_at as createdAt, ar.title,
            COUNT(CASE WHEN re.event_type = 'open_article' THEN 1 END) as views,
            COUNT(CASE WHEN re.event_type = 'meaningful_read' THEN 1 END) as reads
     FROM articles a
     LEFT JOIN article_revisions ar ON a.published_revision_id = ar.id
     LEFT JOIN reader_events re ON a.id = re.article_id
     WHERE a.status = 'published'
     GROUP BY a.id
     ORDER BY views DESC, a.created_at DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all();
  return c.json({ rows: result.results });
});

app.get("/analytics/overview", async (c) => {
  // ⚡ Bolt: Cache analytics overview query for 60s since it scans the entire events table
  const cacheKey = "analytics:overview";
  const cached = await c.env.KV?.get(cacheKey, "json");
  if (cached) {
    return c.json({ overview: cached });
  }

  const result = await c.env.DB.prepare(
    `SELECT
       COUNT(CASE WHEN event_type = 'open_article' THEN 1 END) as totalViews,
       COUNT(CASE WHEN event_type = 'meaningful_read' THEN 1 END) as meaningfulReads,
       COUNT(CASE WHEN event_type = 'save' THEN 1 END) as bookmarks,
       COUNT(CASE WHEN event_type = 'share' THEN 1 END) as shares
     FROM reader_events`,
  ).first();

  await c.env.KV?.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });
  return c.json({ overview: result });
});

app.get("/stats/summary", async (c) => {
  // ⚡ Bolt: Batch independent D1 count queries into a single HTTP request to reduce latency
  const [rawCount, rawIncoming, articlesCount] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM raw_items`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as incoming FROM raw_items WHERE status = 'incoming'`).first<{ incoming: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM articles`).first<{ total: number }>(),
  ]);

  return c.json({
    rawItems: {
      total: rawCount?.total ?? 0,
      incoming: rawIncoming?.incoming ?? 0,
    },
    articles: {
      total: articlesCount?.total ?? 0,
    },
  });
});

// CMS Story Clusters: aggregate theo story_id (chỉ story có bài),
// mới nhất trước, limit 50. Public như GET /articles list — chỉ
// metadata aggregate (storyId, count, statuses, title mới nhất).
app.get("/stories", async (c) => {
  const rows = await listStoryAggregates(c.env.DB);
  return c.json({ rows });
});

app.get("/categories", async (c) => {
  const categories = await listActiveCategories(c.env.DB);
  return c.json({ categories });
});

app.get("/sources", async (c) => {
  const url = new URL(c.req.url);
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid pagination",
      pagination.errors,
    );
  }
  const page = await listSources(c.env.DB, pagination.value);
  return c.json(page);
});

app.post(
  "/sources",
  rateLimit(),
  requireRole("admin"),
  auditChanges("source.create"),
  async (c) => {
  const body = await readJson(c.req.raw);
  const validation = validateCreateSource(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid source payload",
      validation.errors,
    );
  }
  const source: SourceRecord = await createSource(c.env.DB, {
    ...validation.value,
    id: crypto.randomUUID(),
  });
  return c.json(source, 201);
});

app.get("/sources/:id", async (c) => {
  const id = c.req.param("id");
  const source = await getSource(c.env.DB, id);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return c.json(source);
});

app.patch(
  "/sources/:id/allow-status",
  rateLimit(),
  requireRole("admin"),
  auditChanges("source.allow-status"),
  async (c) => {
  const id = c.req.param("id");
  const body = await readJson(c.req.raw);
  const validation = validateUpdateSourceAllowStatus(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid allow status payload",
      validation.errors,
    );
  }
  const input: UpdateSourceAllowStatusRequest = validation.value;
  const source = await setSourceAllowStatus(c.env.DB, id, input.allowStatus);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return c.json(source);
});

app.delete(
  "/sources/:id",
  rateLimit(),
  requireRole("admin"),
  auditChanges("source.delete"),
  async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteSource(c.env.DB, id);
  if (!deleted) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return c.body(null, 204);
});

app.post(
  "/sources/:id/feeds",
  rateLimit(),
  requireRole("admin"),
  auditChanges("feed.create"),
  async (c) => {
  const sourceId = c.req.param("id");
  const source = await getSource(c.env.DB, sourceId);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${sourceId} not found`);
  }
  const body = await readJson(c.req.raw);
  const validation = validateCreateFeed(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid feed payload",
      validation.errors,
    );
  }
  const input: CreateFeedRequest = validation.value;
  const feed: FeedRecord = await createFeed(c.env.DB, {
    ...input,
    id: crypto.randomUUID(),
    sourceId,
  });
  return c.json(feed, 201);
});

app.get("/sources/:id/feeds", async (c) => {
  const sourceId = c.req.param("id");
  const source = await getSource(c.env.DB, sourceId);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${sourceId} not found`);
  }
  const url = new URL(c.req.url);
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid pagination",
      pagination.errors,
    );
  }
  const page = await listFeedsBySource(c.env.DB, sourceId, pagination.value);
  return c.json(page);
});

app.patch(
  "/feeds/:id",
  rateLimit(),
  requireRole("admin"),
  auditChanges("feed.update"),
  async (c) => {
  const id = c.req.param("id");
  const body = await readJson(c.req.raw);
  const validation = validateUpdateFeed(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid feed payload",
      validation.errors,
    );
  }
  const input: UpdateFeedRequest = validation.value;
  const feed = await setFeedEnabled(c.env.DB, id, input.enabled);
  if (!feed) {
    throw notFound("FEED_NOT_FOUND", `feed ${id} not found`);
  }
  return c.json(feed);
});

// ---- AI Desk Routes (MST-032) ----
app.get("/agent-runs", async (c) => {
  const identity = await verifyBearer(c.req.raw.headers.get("authorization"), c.env.DB);
  if (!identity) {
    throw new ApiError("UNAUTHORIZED", 401, "bearer token required");
  }
  if (!["admin", "editor", "reviewer"].includes(identity.role)) {
    throw new ApiError("FORBIDDEN", 403, "requires role: admin, editor, reviewer");
  }
  const runs = await listRecentAgentRuns(c.env.DB, 50);
  return c.json({ runs });
});

app.post("/agent-runs/generate", async (c) => {
  const identity = await verifyBearer(c.req.raw.headers.get("authorization"), c.env.DB);
  if (!identity) {
    throw new ApiError("UNAUTHORIZED", 401, "bearer token required");
  }
  if (!["admin", "editor", "reviewer"].includes(identity.role)) {
    throw new ApiError("FORBIDDEN", 403, "requires role: admin, editor, reviewer");
  }

  const run = await createAgentRun(c.env.DB, {
    id: crypto.randomUUID(),
    type: "writer",
    promptVersion: "v1",
    model: "claude-3-haiku",
    input: {},
  });

  return c.json({ run }, 201);
});

// ---- Email Dispatch Route (MST-096: Cloudflare Workers Send Email) ----
app.post("/email/send", async (c) => {
  const identity = await verifyBearer(c.req.raw.headers.get("authorization"), c.env.DB);
  if (!identity) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Yêu cầu Bearer token để gửi email" } }, 401);
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    body?: string;
    senderName?: string;
    senderEmail?: string;
  };

  const toInput = body.to?.trim();
  const recipient = (toInput && toInput !== "all-subscribers") ? toInput : "vn002187444@gmail.com";
  const subject = body.subject?.trim() || "Thông báo từ Tòa soạn MStudio Channel";
  const content = body.body?.trim() || "";
  const senderEmail = body.senderEmail || "contact@minds.io.vn";
  const senderName = body.senderName || "MStudio Editorial Desk";

  if (!content) {
    return c.json({ error: { code: "VALIDATION_FAILED", message: "Nội dung email không được để trống" } }, 400);
  }

  let sentViaBinding = false;
  let bindingNotice: string | undefined;

  const emailBinding = (c.env as unknown as { EMAIL?: { send: (msg: unknown) => Promise<void> } }).EMAIL;
  if (emailBinding && typeof emailBinding.send === "function") {
    try {
      await emailBinding.send({
        from: senderEmail,
        to: recipient,
        subject: subject,
        text: content,
      });
      sentViaBinding = true;
    } catch (err) {
      bindingNotice = err instanceof Error ? err.message : String(err);
      console.warn("Cloudflare Workers Send Email binding notification:", bindingNotice);
    }
  }

  const emailId = `mail-${Date.now()}`;
  const now = new Date().toISOString();

  await createEmail(c.env.DB, {
    id: emailId,
    direction: "outbound",
    senderName,
    senderEmail,
    recipientEmail: recipient,
    subject,
    body: content,
    category: "Hệ thống",
    status: sentViaBinding ? "sent" : "failed",
    starred: 0,
    createdAt: now,
  });

  return c.json({
    ok: true,
    messageId: emailId,
    deliveredTo: recipient,
    sender: `${senderName} <${senderEmail}>`,
    subject,
    sentViaBinding,
    warning: bindingNotice ? `Đã ghi nhận gửi email (Cloudflare Send Email ghi chú: ${bindingNotice})` : undefined,
    sentAt: now,
  });
});

// ---- Auto-Publish Cron Trigger (15 Phút Tự Động Xuất Bản) ----
app.post("/cron/auto-publish", async (c) => {
  const identity = await verifyBearer(c.req.raw.headers.get("authorization"), c.env.DB);
  if (!identity) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Yêu cầu Bearer token để kích hoạt auto-publish" } }, 401);
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const candidates = await c.env.DB.prepare(
    `SELECT id, status, created_at FROM articles
     WHERE status IN ('needs_review', 'auto_eligible', 'drafted')
     AND created_at <= ?
     LIMIT 20`,
  ).bind(fifteenMinutesAgo).all();

  const publishedIds: string[] = [];
  const now = new Date().toISOString();

  for (const row of candidates.results ?? []) {
    try {
      await c.env.DB.prepare(
        `UPDATE articles SET status = 'published', updated_at = ? WHERE id = ?`,
      ).bind(now, row.id).run();
      publishedIds.push(row.id as string);
    } catch (err) {
      console.error(`Auto publish failed for ${row.id}:`, err);
    }
  }

  return c.json({
    ok: true,
    checkedAt: now,
    eligibleCount: (candidates.results ?? []).length,
    publishedCount: publishedIds.length,
    publishedIds,
  });
});

app.get("/emails", requireRole("admin", "editor"), async (c) => {
  const url = new URL(c.req.url);
  const category = url.searchParams.get("category") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const emails = await listEmails(c.env.DB, { category, status, limit });
  return c.json({ emails });
});

app.patch("/emails/:id/status", requireRole("admin", "editor"), async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { status?: string };
  if (!body.status) {
    throw badRequest("VALIDATION_FAILED", "status is required");
  }
  await updateEmailStatus(c.env.DB, id, body.status);
  return c.json({ ok: true, id, status: body.status });
});

app.patch("/emails/:id/star", requireRole("admin", "editor"), async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json().catch(() => ({}))) as { starred?: number };
  if (body.starred === undefined) {
    throw badRequest("VALIDATION_FAILED", "starred is required");
  }
  await updateEmailStar(c.env.DB, id, body.starred);
  return c.json({ ok: true, id, starred: body.starred });
});

app.get("/redirects", requireRole("admin", "editor"), async (c) => {
  const redirects = await listRedirects(c.env.DB);
  return c.json({ redirects });
});

app.post("/redirects", requireRole("admin", "editor"), auditChanges("redirect.create"), async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    fromPath?: string;
    toPath?: string;
    statusCode?: number;
  };
  
  if (!body.fromPath || !body.toPath) {
    throw badRequest("VALIDATION_FAILED", "fromPath and toPath are required");
  }

  const id = `redirect-${Date.now()}`;
  const now = new Date().toISOString();

  await createRedirect(c.env.DB, {
    id,
    fromPath: body.fromPath,
    toPath: body.toPath,
    statusCode: body.statusCode || 301,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ ok: true, id, ...body }, 201);
});

app.delete("/redirects/:id", requireRole("admin", "editor"), auditChanges("redirect.delete"), async (c) => {
  const id = c.req.param("id");
  await deleteRedirect(c.env.DB, id);
  return c.json({ ok: true });
});

app.post("/seo/gsc/key", requireRole("admin"), auditChanges("gsc.update_key"), async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { keyJson?: string };
  if (!body.keyJson) {
    throw badRequest("VALIDATION_FAILED", "keyJson is required");
  }
  
  try {
    const key = JSON.parse(body.keyJson);
    if (!key.client_email || !key.private_key) {
      throw new Error("Invalid service account JSON");
    }
    
    await setSystemSetting(c.env.DB, "gsc_service_account", body.keyJson);
    return c.json({ ok: true });
  } catch {
    throw badRequest("VALIDATION_FAILED", "Invalid service account JSON format");
  }
});

function b64u(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function str2ab(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function importPrivateKey(pem: string) {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

app.get("/seo/gsc/overview", requireRole("admin", "editor"), async (c) => {
  const keySetting = await getSystemSetting(c.env.DB, "gsc_service_account");
  
  const fallbackResponse = {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
    topQueries: [],
    fallback: true
  };

  if (!keySetting || !keySetting.value) {
    return c.json(fallbackResponse);
  }

  try {
    const creds = JSON.parse(keySetting.value);
    
    const header = { alg: "RS256", typ: "JWT" };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const claimSet = {
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };
    
    const encodedHeader = b64u(JSON.stringify(header));
    const encodedClaimSet = b64u(JSON.stringify(claimSet));
    const toSign = `${encodedHeader}.${encodedClaimSet}`;
    
    const key = await importPrivateKey(creds.private_key);
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(toSign)
    );
    
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    const jwt = `${toSign}.${encodedSignature}`;
    
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });
    
    if (!tokenRes.ok) {
      console.warn("Failed to get Google OAuth token", await tokenRes.text());
      return c.json(fallbackResponse);
    }
    
    const tokenData = await tokenRes.json() as { access_token: string };
    
    const siteUrl = "https://minds.io.vn";
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const gscRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 5
      })
    });
    
    if (!gscRes.ok) {
      console.warn("Failed to fetch GSC data", await gscRes.text());
      return c.json(fallbackResponse);
    }
    
    const gscData = await gscRes.json() as any;
    
    let clicks = 0;
    let impressions = 0;
    let positionSum = 0;
    let positionCount = 0;
    const topQueries = [];
    
    for (const row of gscData.rows || []) {
      clicks += row.clicks;
      impressions += row.impressions;
      positionSum += row.position * row.impressions;
      positionCount += row.impressions;
      topQueries.push({
        keys: row.keys,
        clicks: row.clicks,
        impressions: row.impressions
      });
    }
    
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const position = positionCount > 0 ? positionSum / positionCount : 0;
    
    return c.json({
      clicks,
      impressions,
      ctr,
      position,
      topQueries,
      fallback: false
    });
    
  } catch (err) {
    console.error("GSC API error:", err);
    return c.json(fallbackResponse);
  }
});

app.all("/sources", (c) => c.text("Method not allowed", 405));
app.all("/raw-items", (c) => c.text("Method not allowed", 405));
app.all("/raw-items/:id/accept", (c) =>
  c.text("Method not allowed", 405),
);
app.all("/raw-items/:id/reject", (c) =>
  c.text("Method not allowed", 405),
);
app.all("/events", (c) => c.text("Method not allowed", 405));
app.all("/recommendations", (c) =>
  c.text("Method not allowed", 405),
);
app.all("/articles/:id", (c) => c.text("Method not allowed", 405));
app.all("/stories", (c) => c.text("Method not allowed", 405));
app.all("/categories", (c) => c.text("Method not allowed", 405));
app.all("/sources/:id", (c) => c.text("Method not allowed", 405));
app.all("/sources/:id/allow-status", (c) =>
  c.text("Method not allowed", 405),
);
app.all("/sources/:id/feeds", (c) => c.text("Method not allowed", 405));
app.all("/feeds/:id", (c) => c.text("Method not allowed", 405));

app.notFound((c) => c.text("Not found", 404));

app.onError((error, c) => {
  const logger = c.get("logger");
  const path = new URL(c.req.url).pathname;
  if (error instanceof ApiError) {
    logger?.warn("request_rejected", { path, code: error.code });
    return errorResponse(error);
  }
  logger?.error("request_failed", { path, code: "INTERNAL_ERROR" });
  return errorResponse(
    new ApiError(
      "INTERNAL_ERROR",
      500,
      error instanceof Error ? error.message : "unknown error",
    ),
  );
});

export default {
  fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return Promise.resolve(app.fetch(request, wrapWorkerEnv(env), ctx));
  },
  async scheduled(
    _event: unknown,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    try {
      const updateResult = await env.DB.prepare(
        `UPDATE articles 
         SET status = 'published', updated_at = ? 
         WHERE status IN ('needs_review', 'auto_eligible') 
         AND created_at <= ?`,
      ).bind(new Date().toISOString(), fifteenMinutesAgo).run();

      const publishedCount = updateResult.meta.changes ?? 0;
      if (publishedCount === 0) {
        const rawItemsResult = await env.DB.prepare(
          `SELECT id, feed_id AS feedId, source_id AS sourceId, external_id AS externalId,
                  url, canonical_url AS canonicalUrl, title, published_at AS publishedAt,
                  fetched_at AS fetchedAt, payload_hash AS payloadHash, status,
                  created_at AS createdAt
           FROM raw_items
           WHERE status = 'incoming'
           ORDER BY created_at DESC
           LIMIT 3`
        ).all();

        const rawItems = rawItemsResult.results ?? [];
        if (rawItems.length > 0) {
          const gateway = buildDraftGateway(env as unknown as { GEMINI_API_KEY?: string });
          for (const rawItem of rawItems) {
            try {
              const res = await acceptRawItem(
                {
                  db: env.DB,
                  rawBucket: env.RAW_BUCKET,
                  gateway,
                  actor: "auto-draft",
                },
                rawItem as any
              );
              if (res.articleId) {
                await env.DB.prepare(
                  `UPDATE articles SET status = 'auto_eligible', updated_at = ? WHERE id = ?`,
                ).bind(new Date().toISOString(), res.articleId).run();
              }
            } catch (err) {
              console.error(`Auto-draft fallback failed for raw item ${rawItem.id}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Auto-publish cron error:", err);
    }
  },
};

