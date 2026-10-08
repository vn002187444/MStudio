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
  CreateSourceRequest,
  FeedRecord,
  SourceRecord,
  UpdateFeedRequest,
  UpdateSourceAllowStatusRequest,
} from "@mstudio/contracts";
import {
  createLogger,
  withCorrelationId,
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

async function listSourcesHandler(
  url: URL,
  db: Env["DB"],
): Promise<Response> {
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest("VALIDATION_FAILED", "invalid pagination", pagination.errors);
  }
  const page = await listSources(db, pagination.value);
  return Response.json(page);
}

async function createSourceHandler(
  request: Request,
  db: Env["DB"],
): Promise<Response> {
  const body = await readJson(request);
  const validation = validateCreateSource(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid source payload",
      validation.errors,
    );
  }
  const source: SourceRecord = await createSource(db, {
    ...validation.value,
    id: crypto.randomUUID(),
  });
  return Response.json(source, { status: 201 });
}

async function getSourceHandler(
  id: string,
  db: Env["DB"],
): Promise<Response> {
  const source = await getSource(db, id);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return Response.json(source);
}

async function updateSourceAllowStatusHandler(
  id: string,
  request: Request,
  db: Env["DB"],
): Promise<Response> {
  const body = await readJson(request);
  const validation = validateUpdateSourceAllowStatus(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid allow status payload",
      validation.errors,
    );
  }
  const input: UpdateSourceAllowStatusRequest = validation.value;
  const source = await setSourceAllowStatus(db, id, input.allowStatus);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return Response.json(source);
}

async function deleteSourceHandler(
  id: string,
  db: Env["DB"],
): Promise<Response> {
  const deleted = await deleteSource(db, id);
  if (!deleted) {
    throw notFound("SOURCE_NOT_FOUND", `source ${id} not found`);
  }
  return new Response(null, { status: 204 });
}

async function createFeedHandler(
  sourceId: string,
  request: Request,
  db: Env["DB"],
): Promise<Response> {
  const source = await getSource(db, sourceId);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${sourceId} not found`);
  }
  const body = await readJson(request);
  const validation = validateCreateFeed(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid feed payload",
      validation.errors,
    );
  }
  const input: CreateFeedRequest = validation.value;
  const feed: FeedRecord = await createFeed(db, {
    ...input,
    id: crypto.randomUUID(),
    sourceId,
  });
  return Response.json(feed, { status: 201 });
}

async function listFeedsBySourceHandler(
  sourceId: string,
  url: URL,
  db: Env["DB"],
): Promise<Response> {
  const source = await getSource(db, sourceId);
  if (!source) {
    throw notFound("SOURCE_NOT_FOUND", `source ${sourceId} not found`);
  }
  const pagination = validatePagination(url.searchParams);
  if (!pagination.ok) {
    throw badRequest("VALIDATION_FAILED", "invalid pagination", pagination.errors);
  }
  const page = await listFeedsBySource(db, sourceId, pagination.value);
  return Response.json(page);
}

async function updateFeedHandler(
  id: string,
  request: Request,
  db: Env["DB"],
): Promise<Response> {
  const body = await readJson(request);
  const validation = validateUpdateFeed(body);
  if (!validation.ok) {
    throw badRequest(
      "VALIDATION_FAILED",
      "invalid feed payload",
      validation.errors,
    );
  }
  const input: UpdateFeedRequest = validation.value;
  const feed = await setFeedEnabled(db, id, input.enabled);
  if (!feed) {
    throw notFound("FEED_NOT_FOUND", `feed ${id} not found`);
  }
  return Response.json(feed);
}

const SOURCE_ID_PATTERN = /^\/sources\/([^/]+)$/;
const SOURCE_ALLOW_STATUS_PATTERN = /^\/sources\/([^/]+)\/allow-status$/;
const SOURCE_FEEDS_PATTERN = /^\/sources\/([^/]+)\/feeds$/;
const FEED_ID_PATTERN = /^\/feeds\/([^/]+)$/;

async function route(
  request: Request,
  url: URL,
  db: Env["DB"],
): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  if (path === "/sources") {
    if (method === "GET") {
      return listSourcesHandler(url, db);
    }
    if (method === "POST") {
      return createSourceHandler(request, db);
    }
    return new Response("Method not allowed", { status: 405 });
  }

  const allowStatusMatch = SOURCE_ALLOW_STATUS_PATTERN.exec(path);
  if (allowStatusMatch) {
    const id = decodeURIComponent(allowStatusMatch[1]);
    if (method === "PATCH") {
      return updateSourceAllowStatusHandler(id, request, db);
    }
    return new Response("Method not allowed", { status: 405 });
  }

  const feedsMatch = SOURCE_FEEDS_PATTERN.exec(path);
  if (feedsMatch) {
    const id = decodeURIComponent(feedsMatch[1]);
    if (method === "GET") {
      return listFeedsBySourceHandler(id, url, db);
    }
    if (method === "POST") {
      return createFeedHandler(id, request, db);
    }
    return new Response("Method not allowed", { status: 405 });
  }

  const sourceMatch = SOURCE_ID_PATTERN.exec(path);
  if (sourceMatch) {
    const id = decodeURIComponent(sourceMatch[1]);
    if (method === "GET") {
      return getSourceHandler(id, db);
    }
    if (method === "DELETE") {
      return deleteSourceHandler(id, db);
    }
    return new Response("Method not allowed", { status: 405 });
  }

  const feedMatch = FEED_ID_PATTERN.exec(path);
  if (feedMatch) {
    const id = decodeURIComponent(feedMatch[1]);
    if (method === "PATCH") {
      return updateFeedHandler(id, request, db);
    }
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response("Not found", { status: 404 });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    ctx.waitUntil(Promise.resolve());
    const { request: tagged, correlationId } = withCorrelationId(request);
    const logger: Logger = createLogger({
      environment: env.ENVIRONMENT,
      logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
      correlationId,
    });
    const url = new URL(tagged.url);

    if (url.pathname === "/healthz") {
      return Response.json({
        ok: true,
        environment: env.ENVIRONMENT,
        correlationId,
      });
    }

    try {
      return await route(tagged, url, env.DB);
    } catch (error) {
      if (error instanceof ApiError) {
        logger.warn("request_rejected", {
          path: url.pathname,
          code: error.code,
        });
        return errorResponse(error);
      }
      logger.error("request_failed", {
        path: url.pathname,
        code: "INTERNAL_ERROR",
      });
      return errorResponse(
        new ApiError(
          "INTERNAL_ERROR",
          500,
          error instanceof Error ? error.message : "unknown error",
        ),
      );
    }
  },
};
