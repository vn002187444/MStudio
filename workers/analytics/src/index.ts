import type { ReaderEventMessage } from "@mstudio/contracts";
import {
  createLogger,
  withCorrelationId,
  type LogLevel,
} from "@mstudio/observability";
import { countModelUsage, processEventBatch } from "./analytics.ts";

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

    if (url.pathname === "/internal/model-usage") {
      const requestedWindow = Number(
        url.searchParams.get("windowHours"),
      );
      const windowHours =
        Number.isFinite(requestedWindow) && requestedWindow > 0
          ? requestedWindow
          : 24;
      const modelUsage = await countModelUsage(
        env.DB,
        windowHours,
      );
      return Response.json({ modelUsage, windowHours });
    }

    logger.info("request", { path: url.pathname, method: tagged.method });
    return new Response("MStudio analytics worker", { status: 200 });
  },

  async queue(
    batch: MessageBatch<ReaderEventMessage>,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    void ctx;
    const logger = createLogger({
      environment: env.ENVIRONMENT,
      logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
      correlationId: `queue-${crypto.randomUUID()}`,
    });
    try {
      const outcome = await processEventBatch(
        batch.messages.map((message) => message.body),
        env,
        logger,
      );
      for (const message of batch.messages) {
        message.ack();
      }
      logger.info("reader_events_processed", {
        inserted: outcome.inserted,
        profilesUpdated: outcome.profilesUpdated,
        dropped: outcome.dropped,
        reason: outcome.reason,
      });
    } catch (error) {
      logger.error("analytics_failed", {
        code: "ANALYTICS_FAILED",
        message: error instanceof Error ? error.message : "unknown error",
      });
      for (const message of batch.messages) {
        message.retry();
      }
    }
  },
} satisfies {
  fetch: (
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ) => Promise<Response>;
  queue: (
    batch: MessageBatch<ReaderEventMessage>,
    env: Env,
    ctx: ExecutionContext,
  ) => Promise<void>;
};
