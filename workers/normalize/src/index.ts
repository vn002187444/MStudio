import {
  createLogger,
  withCorrelationId,
  type LogLevel,
} from "@mstudio/observability";
import type { NormalizeJobMessage } from "@mstudio/contracts";
import { processNormalizeMessage } from "./normalize.ts";

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

    logger.info("request", { path: url.pathname, method: tagged.method });
    return new Response("MStudio normalize worker", { status: 200 });
  },

  async queue(
    batch: MessageBatch<NormalizeJobMessage>,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    void ctx;
    const logger = createLogger({
      environment: env.ENVIRONMENT,
      logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
      correlationId: `queue-${crypto.randomUUID()}`,
    });
    for (const message of batch.messages) {
      try {
        await processNormalizeMessage(message.body, env, logger);
        message.ack();
      } catch (error) {
        logger.error("normalize_failed", {
          code: "NORMALIZE_FAILED",
          message:
            error instanceof Error ? error.message : "unknown error",
        });
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
    batch: MessageBatch<NormalizeJobMessage>,
    env: Env,
    ctx: ExecutionContext,
  ) => Promise<void>;
};
