export type QuotaKind = "ai" | "d1" | "r2";

export const QUOTA_KINDS: readonly QuotaKind[] = ["ai", "d1", "r2"];

export function isQuotaKind(value: unknown): value is QuotaKind {
  return (
    typeof value === "string" &&
    (QUOTA_KINDS as readonly string[]).includes(value)
  );
}

/** Machine-readable cause when checkQuota() returns allowed: false. */
export type QuotaBlockReason = "ai_kill_switch" | "quota_exceeded";

/**
 * Where today's usage counter came from: the persisted quota_usage
 * table, or the in-memory fallback used when D1 is unavailable.
 */
export type QuotaUsageSource = "d1" | "memory";

/** Where the enforced daily limit came from. */
export type QuotaLimitSource = "env" | "reference" | "none";

export interface QuotaCheckResult {
  allowed: boolean;
  /** Budget left for today; undefined when no limit is configured. */
  remaining?: number;
  /** Present only when allowed is false. */
  reason?: QuotaBlockReason;
  usageSource?: QuotaUsageSource;
}

export interface QuotaUsageRecord {
  kind: QuotaKind;
  /** UTC day (YYYY-MM-DD) — Cloudflare free-tier quotas reset 00:00 UTC. */
  day: string;
  /** Number of operations recorded. */
  count: number;
  /** Sum of cost units recorded (rows for d1, calls for ai, ops for r2). */
  costSum: number;
  updatedAt: string;
}

export interface QuotaKindSummary {
  kind: QuotaKind;
  count: number;
  used: number;
  /** null = no limit configured for this kind. */
  limit: number | null;
  limitSource: QuotaLimitSource;
  remaining: number | null;
  /** true when limit is a published free-tier reference, not a configured value. */
  estimate: boolean;
}

export interface QuotaSummaryResponse {
  day: string;
  generatedAt: string;
  aiKillSwitch: boolean;
  usageSource: QuotaUsageSource;
  kinds: QuotaKindSummary[];
}
