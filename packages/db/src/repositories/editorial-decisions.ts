import type { D1Database } from "@cloudflare/workers-types";
import type { DraftSource, RawItemDecision } from "@mstudio/contracts";

export interface EditorialDecisionRecord {
  id: string;
  rawItemId: string;
  decision: RawItemDecision;
  storyId?: string;
  articleId?: string;
  revisionId?: string;
  draftSource?: DraftSource;
  actor: string;
  decidedAt: string;
  createdAt: string;
}

export interface NewEditorialDecision {
  id: string;
  rawItemId: string;
  decision: RawItemDecision;
  storyId?: string;
  articleId?: string;
  revisionId?: string;
  draftSource?: DraftSource;
  actor: string;
  decidedAt?: string;
  now?: string;
}

interface EditorialDecisionRowRaw {
  id: string;
  rawItemId: string;
  decision: RawItemDecision;
  storyId: string | null;
  articleId: string | null;
  revisionId: string | null;
  draftSource: DraftSource | null;
  actor: string;
  decidedAt: string;
  createdAt: string;
}

const DECISION_SELECT = `
  SELECT id, raw_item_id AS rawItemId, decision,
         story_id AS storyId, article_id AS articleId,
         revision_id AS revisionId, draft_source AS draftSource,
         actor, decided_at AS decidedAt, created_at AS createdAt
  FROM editorial_decisions
`;

function toDecisionRow(
  row: EditorialDecisionRowRaw,
): EditorialDecisionRecord {
  return {
    ...row,
    storyId: row.storyId ?? undefined,
    articleId: row.articleId ?? undefined,
    revisionId: row.revisionId ?? undefined,
    draftSource: row.draftSource ?? undefined,
  };
}

export async function createEditorialDecision(
  db: D1Database,
  input: NewEditorialDecision,
): Promise<{ row: EditorialDecisionRecord; created: boolean }> {
  const now = input.now ?? new Date().toISOString();
  const decidedAt = input.decidedAt ?? now;
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO editorial_decisions
         (id, raw_item_id, decision, story_id, article_id, revision_id,
          draft_source, actor, decided_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.rawItemId,
      input.decision,
      input.storyId ?? null,
      input.articleId ?? null,
      input.revisionId ?? null,
      input.draftSource ?? null,
      input.actor,
      decidedAt,
      now,
    )
    .run();
  const row = await getEditorialDecision(db, input.rawItemId);
  if (!row) {
    throw new Error("editorial decision not found after insert");
  }
  return { row, created: result.meta.changes > 0 };
}

export async function getEditorialDecision(
  db: D1Database,
  rawItemId: string,
): Promise<EditorialDecisionRecord | undefined> {
  const row = await db
    .prepare(`${DECISION_SELECT} WHERE raw_item_id = ?`)
    .bind(rawItemId)
    .first<EditorialDecisionRowRaw>();
  return row ? toDecisionRow(row) : undefined;
}
