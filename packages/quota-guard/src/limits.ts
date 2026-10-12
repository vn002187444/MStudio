import type { QuotaKind, QuotaLimitSource } from "@mstudio/contracts";
import { QUOTA_KINDS } from "@mstudio/contracts";

export interface QuotaLimit {
  kind: QuotaKind;
  /** Enforced daily budget in cost units; null = unlimited/unconfigured. */
  limit: number | null;
  /** Where the enforced number came from. */
  limitSource: QuotaLimitSource;
  /**
   * Published Cloudflare free-tier daily budget used for reporting when
   * no explicit env limit is set (estimate only, never invented).
   */
  reference: number | null;
}

/**
 * Cloudflare Free-tier budgets referenced from published docs
 * (read 2026-10-12), cost units per day (quota resets 00:00 UTC):
 * - D1 Free: 5,000,000 rows read/day (write quota is separate; the guard
 *   tracks read rows so a hot reader loop cannot silently drain the day).
 * - R2 Free: quota is monthly (1M Class A + 10M Class B), so no daily
 *   reference — operators must set QUOTA_LIMIT_R2 if they want a daily cap.
 * - AI: Gemini quota is not a Cloudflare free-tier budget — operators must
 *   set QUOTA_LIMIT_AI explicitly (Human Lead config), never guessed here.
 */
export const CF_FREE_TIER_DAILY_REFERENCE: Record<QuotaKind, number | null> = {
  ai: null,
  d1: 5_000_000,
  r2: null,
};

export function quotaLimitEnvName(kind: QuotaKind): string {
  return `QUOTA_LIMIT_${kind.toUpperCase()}`;
}

function parseLimit(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return Math.floor(value);
}

/** Priority: QUOTA_LIMIT_{KIND} env > CF free-tier reference > unlimited. */
export function resolveQuotaLimits(
  env: Record<string, string | undefined>,
): Record<QuotaKind, QuotaLimit> {
  const limits = {} as Record<QuotaKind, QuotaLimit>;
  for (const kind of QUOTA_KINDS) {
    const configured = parseLimit(env[quotaLimitEnvName(kind)]);
    const reference = CF_FREE_TIER_DAILY_REFERENCE[kind];
    const limit = configured ?? reference;
    limits[kind] = {
      kind,
      limit,
      limitSource:
        configured !== undefined
          ? "env"
          : limit === null
            ? "none"
            : "reference",
      reference,
    };
  }
  return limits;
}
