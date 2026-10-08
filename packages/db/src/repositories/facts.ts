import type { D1Database } from "@cloudflare/workers-types";
import type { FactRecord } from "@mstudio/contracts";

export type FactRow = FactRecord;

interface FactRowRaw {
  id: string;
  storyId: string;
  text: string;
  sourceRefs: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewFact {
  id: string;
  storyId: string;
  text: string;
  sourceRefs?: string[];
  confidence?: number;
  now?: string;
}

const FACT_SELECT = `
  SELECT id, story_id AS storyId, text,
         source_refs AS sourceRefs, confidence,
         created_at AS createdAt, updated_at AS updatedAt
  FROM facts
`;

function toFactRow(row: FactRowRaw): FactRow {
  return {
    ...row,
    sourceRefs: JSON.parse(row.sourceRefs) as string[],
  };
}

export async function createFact(
  db: D1Database,
  input: NewFact,
): Promise<FactRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO facts
         (id, story_id, text, source_refs, confidence, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.storyId,
      input.text,
      JSON.stringify(input.sourceRefs ?? []),
      input.confidence ?? 0,
      now,
      now,
    )
    .run();
  const row = await listFacts(db, input.storyId).then((rows) =>
    rows.find((candidate) => candidate.id === input.id),
  );
  if (!row) throw new Error("fact not found after insert");
  return row;
}

export async function listFacts(
  db: D1Database,
  storyId: string,
): Promise<FactRow[]> {
  const rows = (
    await db
      .prepare(`${FACT_SELECT} WHERE story_id = ? ORDER BY created_at ASC, id ASC`)
      .bind(storyId)
      .all<FactRowRaw>()
  ).results;
  return rows.map(toFactRow);
}

export async function updateFactConfidence(
  db: D1Database,
  id: string,
  confidence: number,
): Promise<FactRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      "UPDATE facts SET confidence = ?, updated_at = ? WHERE id = ?",
    )
    .bind(confidence, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  const row = await db
    .prepare(`${FACT_SELECT} WHERE id = ?`)
    .bind(id)
    .first<FactRowRaw>();
  return row ? toFactRow(row) : undefined;
}
