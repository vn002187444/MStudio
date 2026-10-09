import { Hono } from "hono";
import {
  createFeed,
  createSource,
  deleteSource,
  getSource,
  listFeedsBySource,
  listSources,
  setFeedEnabled,
  setSourceAllowStatus,
} from "@mstudio/db";
import type {
  ApiErrorResponse,
  CreateFeedRequest,
  FeedRecord,
  SourceRecord,
  UpdateFeedRequest,
  UpdateSourceAllowStatusRequest,
} from "@mstudio/contracts";
import {
  createLogger,
  getCorrelationId,
  type LogLevel,
  type Logger,
} from "@mstudio/observability";
import {
  validateCreateFeed,
  validateCreateSource,
  validatePagination,
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

type AppEnv = {
  Bindings: Env;
  Variables: {
    correlationId: string;
    logger: Logger;
  };
};

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const correlationId = getCorrelationId(c.req.raw);
  const logger = createLogger({
    environment: c.env.ENVIRONMENT,
    logLevel: (c.env.LOG_LEVEL ?? "info") as LogLevel,
    correlationId,
  });
  c.set("correlationId", correlationId);
  c.set("logger", logger);
  await next();
});

app.get("/healthz", (c) =>
  c.json({
    ok: true,
    environment: c.env.ENVIRONMENT,
    correlationId: c.get("correlationId"),
  }),
);

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

app.post("/sources", async (c) => {
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

app.patch("/sources/:id/allow-status", async (c) => {
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

app.delete("/sources/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteSource(c.env.DB, id);
  if (!deleted) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return c.body(null, 204);
});

app.post("/sources/:id/feeds", async (c) => {
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

app.patch("/feeds/:id", async (c) => {
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

app.all("/sources", (c) => c.text("Method not allowed", 405));
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

export default app;
