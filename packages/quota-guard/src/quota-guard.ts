import type { D1Database } from "@cloudflare/workers-types";
import type {
  QuotaCheckResult,
  QuotaKind,
  QuotaKindSummary,
  QuotaSummaryResponse,
  QuotaUsageRecord,
  QuotaUsageSource,
} from "@mstudio/contracts";
import { QUOTA_KINDS } from "@mstudio/contracts";
import { getQuotaUsage, listQuotaUsage, recordQuotaUsage } from "@mstudio/db";
import { aiKillSwitchEnabled } from "./kill-switch.ts";
import { resolveQuotaLimits, type QuotaLimit } from "./limits.ts";

export interface QuotaGuardLogger {
  warn(message: string, fields?: Record<string, unknown>): void;
}

export interface QuotaGuardOptions {
  /** Absent → memory-only counters (dev/tests); usage is not persisted. */
  db?: D1Database;
  env: Record<string, string | undefined>;
  now?: () => Date;
  logger?: QuotaGuardLogger;
}

export interface QuotaGuard {
  /** Decide whether a cost may be spent today. Never charges. */
  checkQuota(kind: QuotaKind, cost: number): Promise<QuotaCheckResult>;
  /** Charge a cost after the operation ran. Never throws. */
  recordUsage(kind: QuotaKind, cost: number): Promise<void>;
  /** Today's counters + limits, for GET /quota/summary. */
  summary(): Promise<QuotaSummaryResponse>;
  readonly aiKillSwitch: boolean;
  readonly limits: Record<QuotaKind, QuotaLimit>;
}

/** UTC day — Cloudflare free-tier quotas reset at 00:00 UTC. */
export function quotaDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

interface KindTally {
  count: number;
  cost: number;
}

interface UsageReading {
  used: number;
  count: number;
  source: QuotaUsageSource;
}

export function createQuotaGuard(options: QuotaGuardOptions): QuotaGuard {
  const { db, env, logger } = options;
  const now = options.now ?? (() => new Date());
  const limits = resolveQuotaLimits(env);
  const aiKillSwitch = aiKillSwitchEnabled(env);
  // Isolate-local totals: used when D1 is unavailable (fallback only).
  const memory = new Map<QuotaKind, KindTally>();
  // Recorded locally but not yet confirmed persisted (D1 write pending).
  const pending = new Map<QuotaKind, KindTally>();

  function addTo(map: Map<QuotaKind, KindTally>, kind: QuotaKind, cost: number): void {
    const current = map.get(kind) ?? { count: 0, cost: 0 };
    map.set(kind, { count: current.count + 1, cost: current.cost + cost });
  }

  function subtractPending(kind: QuotaKind, cost: number): void {
    const current = pending.get(kind);
    if (!current) return;
    const next = { count: current.count - 1, cost: current.cost - cost };
    if (next.count <= 0 && next.cost <= 0) pending.delete(kind);
    else pending.set(kind, next);
  }

  async function readUsage(kind: QuotaKind, day: string): Promise<UsageReading> {
    const memoryTally = memory.get(kind) ?? { count: 0, cost: 0 };
    if (!db) {
      return { used: memoryTally.cost, count: memoryTally.count, source: "memory" };
    }
    try {
      const row = await getQuotaUsage(db, kind, day);
      const pendingTally = pending.get(kind) ?? { count: 0, cost: 0 };
      return {
        used: (row?.costSum ?? 0) + pendingTally.cost,
        count: (row?.count ?? 0) + pendingTally.count,
        source: "d1",
      };
    } catch (error) {
      logger?.warn("quota_usage_read_failed", {
        kind,
        day,
        message: error instanceof Error ? error.message : String(error),
      });
      return { used: memoryTally.cost, count: memoryTally.count, source: "memory" };
    }
  }

  async function checkQuota(
    kind: QuotaKind,
    cost: number,
  ): Promise<QuotaCheckResult> {
    const charge = Number.isFinite(cost) && cost > 0 ? cost : 0;
    const day = quotaDay(now());
    const limit = limits[kind];

    if (kind === "ai" && aiKillSwitch) {
      const reading = await readUsage(kind, day);
      return {
        allowed: false,
        reason: "ai_kill_switch",
        remaining: limit.limit === null ? undefined : Math.max(0, limit.limit - reading.used),
        usageSource: reading.source,
      };
    }

    const reading = await readUsage(kind, day);
    if (limit.limit === null) {
      return { allowed: true, usageSource: reading.source };
    }
    const remaining = limit.limit - reading.used;
    if (charge > remaining) {
      return {
        allowed: false,
        reason: "quota_exceeded",
        remaining: Math.max(0, remaining),
        usageSource: reading.source,
      };
    }
    return {
      allowed: true,
      remaining: remaining - charge,
      usageSource: reading.source,
    };
  }

  async function recordUsage(kind: QuotaKind, cost: number): Promise<void> {
    const charge = Number.isFinite(cost) && cost > 0 ? cost : 0;
    if (charge === 0) return;
    addTo(memory, kind, charge);
    addTo(pending, kind, charge);
    if (!db) return;
    const day = quotaDay(now());
    try {
      await recordQuotaUsage(db, {
        kind,
        day,
        count: 1,
        costSum: charge,
        now: now().toISOString(),
      });
      subtractPending(kind, charge);
    } catch (error) {
      // Accounting must never break the caller: pending stays so the
      // in-memory total still covers this isolate until D1 recovers.
      logger?.warn("quota_usage_write_failed", {
        kind,
        day,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function summary(): Promise<QuotaSummaryResponse> {
    const instant = now();
    const day = quotaDay(instant);
    let source: QuotaUsageSource = "d1";
    let rows: QuotaUsageRecord[] = [];
    if (!db) {
      source = "memory";
    } else {
      try {
        rows = await listQuotaUsage(db, day);
      } catch (error) {
        source = "memory";
        logger?.warn("quota_summary_read_failed", {
          day,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const byKind = new Map(rows.map((row) => [row.kind, row]));
    const kinds: QuotaKindSummary[] = QUOTA_KINDS.map((kind) => {
      const limit = limits[kind];
      const row = byKind.get(kind);
      const pendingTally = pending.get(kind) ?? { count: 0, cost: 0 };
      const count = row ? row.count + pendingTally.count : 0;
      const used = row ? row.costSum + pendingTally.cost : 0;
      return {
        kind,
        count,
        used,
        limit: limit.limit,
        limitSource: limit.limitSource,
        remaining: limit.limit === null ? null : Math.max(0, limit.limit - used),
        estimate: limit.limitSource === "reference",
      };
    });
    return {
      day,
      generatedAt: instant.toISOString(),
      aiKillSwitch,
      usageSource: source,
      kinds,
    };
  }

  return { checkQuota, recordUsage, summary, aiKillSwitch, limits };
}
