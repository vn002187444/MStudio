import type { D1Database } from "@cloudflare/workers-types";
import type { QuotaKind, QuotaUsageRecord } from "@mstudio/contracts";
import { isQuotaKind } from "@mstudio/contracts";

interface QuotaUsageRowRaw {
  kind: string;
  day: string;
  count: number;
  costSum: number;
  updatedAt: string;
}

export interface RecordQuotaUsageInput {
  kind: QuotaKind;
  /** UTC day, YYYY-MM-DD. */
  day: string;
  count: number;
  costSum: number;
  now: string;
}

function toQuotaUsageRecord(row: QuotaUsageRowRaw): QuotaUsageRecord | undefined {
  if (!isQuotaKind(row.kind)) return undefined;
  return {
    kind: row.kind,
    day: row.day,
    count: row.count,
    costSum: row.costSum,
    updatedAt: row.updatedAt,
  };
}

/**
 * Increment today's counter for one kind. Atomic upsert so concurrent
 * isolates add to the same row instead of racing on read-then-write.
 * One row write per call — QuotaGuard callers must batch before writing.
 */
export async function recordQuotaUsage(
  db: D1Database,
  input: RecordQuotaUsageInput,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO quota_usage (kind, day, "count", cost_sum, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (kind, day) DO UPDATE SET
         "count" = "count" + excluded."count",
         cost_sum = cost_sum + excluded.cost_sum,
         updated_at = excluded.updated_at`,
    )
    .bind(input.kind, input.day, input.count, input.costSum, input.now)
    .run();
}

export async function getQuotaUsage(
  db: D1Database,
  kind: QuotaKind,
  day: string,
): Promise<QuotaUsageRecord | undefined> {
  const row = await db
    .prepare(
      `SELECT kind, day, "count", cost_sum AS costSum, updated_at AS updatedAt
       FROM quota_usage WHERE kind = ? AND day = ?`,
    )
    .bind(kind, day)
    .first<QuotaUsageRowRaw>();
  if (!row) return undefined;
  return toQuotaUsageRecord(row);
}

export async function listQuotaUsage(
  db: D1Database,
  day: string,
): Promise<QuotaUsageRecord[]> {
  const results = (
    await db
      .prepare(
        `SELECT kind, day, "count", cost_sum AS costSum, updated_at AS updatedAt
         FROM quota_usage WHERE day = ? ORDER BY kind ASC`,
      )
      .bind(day)
      .all<QuotaUsageRowRaw>()
  ).results;
  return results
    .map(toQuotaUsageRecord)
    .filter((record): record is QuotaUsageRecord => record !== undefined);
}
