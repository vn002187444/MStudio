import {
  createLogger,
  getCorrelationId,
  jobError,
  jobErrorResponse,
  withCorrelationId,
  type LogLevel,
} from "@mstudio/observability";
import { runScheduler } from "./scheduler.ts";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    ctx.waitUntil(Promise.resolve());
    const { request: tagged, correlationId } = withCorrelationId(request);
    const logger = createLogger({
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

    if (tagged.method !== "GET" && tagged.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      logger.info("request", { path: url.pathname, method: tagged.method });
      return new Response("MStudio ingest worker skeleton", { status: 200 });
    } catch (error) {
      const envelope = jobError({
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "unknown error",
        correlationId,
        cause: error,
      });
      logger.error("request_failed", {
        path: url.pathname,
        code: envelope.code,
      });
      return jobErrorResponse(envelope);
    }
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    void controller;
    const correlationId = `scheduled-${crypto.randomUUID()}`;
    const logger = createLogger({
      environment: env.ENVIRONMENT,
      logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
      correlationId,
    });
    ctx.waitUntil(
      runScheduler(env, logger).catch((error: unknown) => {
        logger.error("scheduler_failed", {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error ? error.message : "unknown error",
        });
      }),
    );
  },
} satisfies {
  fetch: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ) => Promise<Response>;
  scheduled: (
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => Promise<void>;
};
