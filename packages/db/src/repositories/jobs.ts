import type { D1Database } from "@cloudflare/workers-types";
import type { JobRecord, JobStatus } from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type { JobStatus };

export type JobRow = JobRecord;

interface JobRowRaw {
  id: string;
  type: string;
  status: JobStatus;
  payload: string;
  attempt: number;
  maxAttempts: number;
  correlationId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface NewJob {
  id: string;
  type: string;
  payload?: string;
  maxAttempts?: number;
  correlationId?: string;
  scheduledAt?: string;
  now?: string;
}

const JOB_SELECT = `
  SELECT id, type, status, payload, attempt, max_attempts AS maxAttempts,
         correlation_id AS correlationId, error_code AS errorCode,
         error_message AS errorMessage, scheduled_at AS scheduledAt,
         started_at AS startedAt, finished_at AS finishedAt,
         created_at AS createdAt
  FROM jobs
`;

function toJobRow(row: JobRowRaw): JobRow {
  return {
    ...row,
    correlationId: row.correlationId ?? undefined,
    errorCode: row.errorCode ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    scheduledAt: row.scheduledAt ?? undefined,
    startedAt: row.startedAt ?? undefined,
    finishedAt: row.finishedAt ?? undefined,
  };
}

export async function createJob(
  db: D1Database,
  input: NewJob,
): Promise<JobRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO jobs
         (id, type, payload, attempt, max_attempts, correlation_id, scheduled_at, created_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.type,
      input.payload ?? "{}",
      input.maxAttempts ?? 3,
      input.correlationId ?? null,
      input.scheduledAt ?? null,
      now,
    )
    .run();
  const row = await getJob(db, input.id);
  if (!row) throw new Error("job not found after insert");
  return row;
}

export async function getJob(
  db: D1Database,
  id: string,
): Promise<JobRow | undefined> {
  const row = await db
    .prepare(`${JOB_SELECT} WHERE id = ?`)
    .bind(id)
    .first<JobRowRaw>();
  return row ? toJobRow(row) : undefined;
}

export async function startJob(
  db: D1Database,
  id: string,
  now = new Date().toISOString(),
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE jobs
       SET status = 'running', attempt = attempt + 1, started_at = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(now, id)
    .run();
  return result.meta.changes > 0;
}

export async function updateJobStatus(
  db: D1Database,
  id: string,
  status: JobStatus,
  error?: { code: string; message: string },
): Promise<JobRow | undefined> {
  const now = new Date().toISOString();
  const terminal = status === "succeeded" || status === "failed";
  const result = await db
    .prepare(
      `UPDATE jobs
       SET status = ?,
           error_code = ?,
           error_message = ?,
           finished_at = ?
       WHERE id = ?`,
    )
    .bind(
      status,
      error?.code ?? null,
      error?.message ?? null,
      terminal ? now : null,
      id,
    )
    .run();
  if (result.meta.changes === 0) return undefined;
  return getJob(db, id);
}

export async function listJobsByStatus(
  db: D1Database,
  status: JobStatus,
  input: PageInput = {},
): Promise<PagedRows<JobRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${JOB_SELECT} WHERE status = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<JobRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${JOB_SELECT} WHERE status = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, limit + 1)
          .all<JobRowRaw>()
      ).results;
  return paginate(results.map(toJobRow), limit);
}
