import type { QuotaMode } from "./quota-guard.ts";

export interface QuotaDegradation {
  disableEmbeddings: boolean;
  disableRecommendationRefresh: boolean;
  ingestIntervalFactor: number;
}

export const SAFE_INGEST_INTERVAL_FACTOR = 2;
export const STOP_INGEST_INTERVAL_FACTOR = 4;

/**
 * Degradation applied per QuotaMode (PLAN.md: reduce analytics
 * before crawl/reprocessing/embeddings/model usage; published
 * content is still served). SAFE and STOP turn off embeddings
 * and recommendation refresh and loosen the ingest cadence;
 * NORMAL and WARN keep everything on.
 */
export function degradationForMode(mode: QuotaMode): QuotaDegradation {
  if (mode === "STOP") {
    return {
      disableEmbeddings: true,
      disableRecommendationRefresh: true,
      ingestIntervalFactor: STOP_INGEST_INTERVAL_FACTOR,
    };
  }
  if (mode === "SAFE") {
    return {
      disableEmbeddings: true,
      disableRecommendationRefresh: true,
      ingestIntervalFactor: SAFE_INGEST_INTERVAL_FACTOR,
    };
  }
  return {
    disableEmbeddings: false,
    disableRecommendationRefresh: false,
    ingestIntervalFactor: 1,
  };
}

/**
 * Applies mode-driven degradation onto a feature-flag record:
 * embeddings and recommendation refresh are forced off in
 * SAFE and STOP. Returns a new record; the input is untouched.
 */
export function applyQuotaDegradation(
  flags: Record<string, boolean>,
  mode: QuotaMode,
): Record<string, boolean> {
  const degradation = degradationForMode(mode);
  const merged = { ...flags };
  if (degradation.disableEmbeddings) {
    merged.embeddingsEnabled = false;
  }
  if (degradation.disableRecommendationRefresh) {
    merged.recommendationRefreshEnabled = false;
  }
  return merged;
}

export interface IngestThrottle {
  skipAll: boolean;
  maxFeedsPerRun?: number;
}

/**
 * Ingest throttling per mode: STOP defers the whole run (the
 * cron fires again next interval — nothing is lost), SAFE halves
 * the feeds processed per run to loosen the effective cadence.
 */
export function ingestThrottleForMode(
  mode: QuotaMode,
  pageSize: number,
): IngestThrottle {
  if (mode === "STOP") {
    return { skipAll: true };
  }
  if (mode === "SAFE") {
    return {
      skipAll: false,
      maxFeedsPerRun: Math.max(1, Math.floor(pageSize / 2)),
    };
  }
  return { skipAll: false };
}
