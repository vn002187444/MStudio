import type { D1Database } from "@cloudflare/workers-types";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type AgentRunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface AgentRunSourceRef {
  sourceId: string;
  snippet?: string;
}

export interface AgentRunRecord {
  id: string;
  storyId?: string;
  jobId?: string;
  type: string;
  promptVersion: string;
  model: string;
  modelVersion?: string;
  evidenceRefs: AgentRunSourceRef[];
  input: unknown;
  output?: unknown;
  status: AgentRunStatus;
  errorCode?: string;
  errorMessage?: string;
  attempt: number;
  maxAttempts: number;
  reviewerDisposition?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface NewAgentRun {
  id: string;
  type: string;
  promptVersion: string;
  model: string;
  modelVersion?: string;
  storyId?: string;
  jobId?: string;
  evidenceRefs?: AgentRunSourceRef[];
  input: unknown;
  maxAttempts?: number;
  now?: string;
}

interface AgentRunRowRaw {
  id: string;
  storyId: string | null;
  jobId: string | null;
  type: string;
  promptVersion: string;
  model: string;
  modelVersion: string | null;
  evidenceRefs: string;
  input: string;
  output: string | null;
  status: AgentRunStatus;
  errorCode: string | null;
  errorMessage: string | null;
  attempt: number;
  maxAttempts: number;
  reviewerDisposition: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

const AGENT_RUN_SELECT = `
  SELECT id, story_id AS storyId, job_id AS jobId, type,
         prompt_version AS promptVersion, model, model_version AS modelVersion,
         evidence_refs AS evidenceRefs, input, output, status,
         error_code AS errorCode, error_message AS errorMessage,
         attempt, max_attempts AS maxAttempts,
         reviewer_disposition AS reviewerDisposition,
         created_at AS createdAt, started_at AS startedAt,
         finished_at AS finishedAt
  FROM agent_runs
`;

function toAgentRunRow(row: AgentRunRowRaw): AgentRunRecord {
  return {
    id: row.id,
    storyId: row.storyId ?? undefined,
    jobId: row.jobId ?? undefined,
    type: row.type,
    promptVersion: row.promptVersion,
    model: row.model,
    modelVersion: row.modelVersion ?? undefined,
    evidenceRefs: JSON.parse(row.evidenceRefs) as AgentRunSourceRef[],
    input: JSON.parse(row.input) as unknown,
    output: row.output === null
      ? undefined
      : (JSON.parse(row.output) as unknown),
    status: row.status,
    errorCode: row.errorCode ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    attempt: row.attempt,
    maxAttempts: row.maxAttempts,
    reviewerDisposition: row.reviewerDisposition ?? undefined,
    createdAt: row.createdAt,
    startedAt: row.startedAt ?? undefined,
    finishedAt: row.finishedAt ?? undefined,
  };
}

export async function createAgentRun(
  db: D1Database,
  input: NewAgentRun,
): Promise<AgentRunRecord> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO agent_runs
         (id, story_id, job_id, type, prompt_version, model, model_version,
          evidence_refs, input, status, attempt, max_attempts, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
    )
    .bind(
      input.id,
      input.storyId ?? null,
      input.jobId ?? null,
      input.type,
      input.promptVersion,
      input.model,
      input.modelVersion ?? null,
      JSON.stringify(input.evidenceRefs ?? []),
      JSON.stringify(input.input ?? {}),
      input.maxAttempts ?? 1,
      now,
    )
    .run();
  const row = await getAgentRun(db, input.id);
  if (!row) throw new Error("agent run not found after insert");
  return row;
}

export async function getAgentRun(
  db: D1Database,
  id: string,
): Promise<AgentRunRecord | undefined> {
  const row = await db
    .prepare(`${AGENT_RUN_SELECT} WHERE id = ?`)
    .bind(id)
    .first<AgentRunRowRaw>();
  return row ? toAgentRunRow(row) : undefined;
}

export async function markAgentRunRunning(
  db: D1Database,
  id: string,
  now = new Date().toISOString(),
): Promise<AgentRunRecord | undefined> {
  const result = await db
    .prepare(
      `UPDATE agent_runs
       SET status = 'running', attempt = attempt + 1,
           started_at = COALESCE(started_at, ?)
       WHERE id = ? AND status IN ('pending', 'running')`,
    )
    .bind(now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getAgentRun(db, id);
}

export async function markAgentRunSucceeded(
  db: D1Database,
  id: string,
  output: unknown,
  now = new Date().toISOString(),
): Promise<AgentRunRecord | undefined> {
  const result = await db
    .prepare(
      `UPDATE agent_runs
       SET status = 'succeeded', output = ?, finished_at = ?
       WHERE id = ?`,
    )
    .bind(JSON.stringify(output ?? null), now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getAgentRun(db, id);
}

export async function markAgentRunFailed(
  db: D1Database,
  id: string,
  error: { code: string; message: string },
  now = new Date().toISOString(),
): Promise<AgentRunRecord | undefined> {
  const result = await db
    .prepare(
      `UPDATE agent_runs
       SET status = 'failed', error_code = ?, error_message = ?,
           finished_at = ?
       WHERE id = ?`,
    )
    .bind(error.code, error.message, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getAgentRun(db, id);
}

export async function listAgentRunsByStory(
  db: D1Database,
  storyId: string,
  input: PageInput = {},
): Promise<PagedRows<AgentRunRecord>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${AGENT_RUN_SELECT} WHERE story_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(storyId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<AgentRunRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${AGENT_RUN_SELECT} WHERE story_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(storyId, limit + 1)
          .all<AgentRunRowRaw>()
      ).results;
  return paginate(results.map(toAgentRunRow), limit);
}
