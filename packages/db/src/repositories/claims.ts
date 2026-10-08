import type { D1Database } from "@cloudflare/workers-types";
import type { ClaimRecord, ClaimStatus } from "@mstudio/contracts";

export type { ClaimStatus };

export type ClaimRow = ClaimRecord;

interface ClaimRowRaw {
  id: string;
  storyId: string;
  text: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewClaim {
  id: string;
  storyId: string;
  text: string;
  status?: ClaimStatus;
  now?: string;
}

const CLAIM_SELECT = `
  SELECT id, story_id AS storyId, text, status,
         created_at AS createdAt, updated_at AS updatedAt
  FROM claims
`;

function toClaimRow(row: ClaimRowRaw): ClaimRow {
  return { ...row };
}

export async function createClaim(
  db: D1Database,
  input: NewClaim,
): Promise<ClaimRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO claims (id, story_id, text, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.storyId,
      input.text,
      input.status ?? "pending",
      now,
      now,
    )
    .run();
  const row = await getClaim(db, input.id);
  if (!row) throw new Error("claim not found after insert");
  return row;
}

export async function getClaim(
  db: D1Database,
  id: string,
): Promise<ClaimRow | undefined> {
  const row = await db
    .prepare(`${CLAIM_SELECT} WHERE id = ?`)
    .bind(id)
    .first<ClaimRowRaw>();
  return row ? toClaimRow(row) : undefined;
}

export async function listClaims(
  db: D1Database,
  storyId: string,
): Promise<ClaimRow[]> {
  const rows = (
    await db
      .prepare(`${CLAIM_SELECT} WHERE story_id = ? ORDER BY created_at ASC, id ASC`)
      .bind(storyId)
      .all<ClaimRowRaw>()
  ).results;
  return rows.map(toClaimRow);
}

export async function setClaimStatus(
  db: D1Database,
  id: string,
  status: ClaimStatus,
): Promise<ClaimRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      "UPDATE claims SET status = ?, updated_at = ? WHERE id = ?",
    )
    .bind(status, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getClaim(db, id);
}
