import { listRawItemsByStatus } from "@mstudio/db";
import type { PageInput } from "@mstudio/contracts";
import {
  createLogger,
  degradationForMode,
  effectiveQuotaMode,
  flagsFromEnv,
  InMemoryQuotaGuard,
  quotaModeFromEnv,
  thresholdsFromEnv,
  withCorrelationId,
  type LogLevel,
  type Logger,
} from "@mstudio/observability";
import { computeClusterCandidates } from "./clustering.ts";

export const DEFAULT_CLUSTER_PAGE_SIZE = 100;

export interface ClusteringStageResult {
  itemsScanned: number;
  candidates: number;
  clusteredItems: number;
  vectorizeEnabled: boolean;
}

export async function runClusteringStage(
  env: Env,
  logger: Logger,
  options: { pageSize?: number } = {},
): Promise<ClusteringStageResult> {
  const db = env.DB;
  if (!db) {
    throw new Error("DB binding must be configured");
  }
  const envRecord = env as unknown as Record<
    string,
    string | undefined
  >;
  const guard = new InMemoryQuotaGuard(
    thresholdsFromEnv(envRecord),
  );
  const mode = effectiveQuotaMode(
    guard.mode(),
    quotaModeFromEnv(envRecord),
  );
  const degradation = degradationForMode(mode);
  const flags = flagsFromEnv(
    envRecord,
  );
  // SAFE and STOP turn off the embeddings path (PLAN.md:
  // reduce embeddings before crawl/reprocessing).
  const vectorizeEnabled =
    flags.vectorizeEnabled === true &&
    !degradation.disableEmbeddings;
  const pageSize = options.pageSize ?? DEFAULT_CLUSTER_PAGE_SIZE;
  let itemsScanned = 0;
  let candidates = 0;
  let clusteredItems = 0;
  let cursor: PageInput["cursor"];
  do {
    const page = await listRawItemsByStatus(db, "incoming", {
      limit: pageSize,
      cursor,
    });
    itemsScanned += page.rows.length;
    const pageCandidates = computeClusterCandidates(page.rows);
    candidates += pageCandidates.length;
    clusteredItems += pageCandidates.reduce(
      (sum, candidate) => sum + candidate.itemIds.length,
      0,
    );
    for (const candidate of pageCandidates) {
      logger.info("cluster_candidate", {
        itemIds: candidate.itemIds,
        signals: candidate.signals,
      });
    }
    if (vectorizeEnabled) {
      logger.info("vectorize_path_enabled", {
        note: "embedding generation arrives with MST-030",
      });
    }
    cursor = page.nextCursor;
  } while (cursor);
  logger.info("clustering_stage_complete", {
    itemsScanned,
    candidates,
    clusteredItems,
    vectorizeEnabled,
    quotaMode: mode,
  });
  return { itemsScanned, candidates, clusteredItems, vectorizeEnabled };
}

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
    return new Response("MStudio intelligence worker", { status: 200 });
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    void controller;
    const logger = createLogger({
      environment: env.ENVIRONMENT,
      logLevel: (env.LOG_LEVEL ?? "info") as LogLevel,
      correlationId: `scheduled-${crypto.randomUUID()}`,
    });
    ctx.waitUntil(
      runClusteringStage(env, logger).catch((error: unknown) => {
        logger.error("clustering_stage_failed", {
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
