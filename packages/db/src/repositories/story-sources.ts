import type { D1Database } from "@cloudflare/workers-types";
import type {
  StorySourceRecord,
  StorySourceRole,
} from "@mstudio/contracts";

export type { StorySourceRole };

export type StorySourceRow = StorySourceRecord;

interface StorySourceRowRaw {
  id: string;
  storyId: string;
  rawItemId: string;
  role: StorySourceRole;
  createdAt: string;
}

export interface NewStorySource {
  id: string;
  storyId: string;
  rawItemId: string;
  role?: StorySourceRole;
  now?: string;
}

const STORY_SOURCE_SELECT = `
  SELECT id, story_id AS storyId, raw_item_id AS rawItemId,
         role, created_at AS createdAt
  FROM story_sources
`;

function toStorySourceRow(row: StorySourceRowRaw): StorySourceRow {
  return { ...row };
}

export async function addStorySource(
  db: D1Database,
  input: NewStorySource,
): Promise<{ row: StorySourceRow; created: boolean }> {
  const now = input.now ?? new Date().toISOString();
  const role = input.role ?? "supporting";
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO story_sources
         (id, story_id, raw_item_id, role, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(input.id, input.storyId, input.rawItemId, role, now)
    .run();
  const row = await findStorySource(
    db,
    input.storyId,
    input.rawItemId,
    role,
  );
  if (!row) throw new Error("story source not found after insert");
  return { row, created: result.meta.changes > 0 };
}

export async function listStorySources(
  db: D1Database,
  storyId: string,
): Promise<StorySourceRow[]> {
  const rows = (
    await db
      .prepare(`${STORY_SOURCE_SELECT} WHERE story_id = ? ORDER BY created_at ASC, id ASC`)
      .bind(storyId)
      .all<StorySourceRowRaw>()
  ).results;
  return rows.map(toStorySourceRow);
}

export async function removeStorySource(
  db: D1Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM story_sources WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

async function findStorySource(
  db: D1Database,
  storyId: string,
  rawItemId: string,
  role: StorySourceRole,
): Promise<StorySourceRow | undefined> {
  const row = await db
    .prepare(
      `${STORY_SOURCE_SELECT} WHERE story_id = ? AND raw_item_id = ? AND role = ?`,
    )
    .bind(storyId, rawItemId, role)
    .first<StorySourceRowRaw>();
  return row ? toStorySourceRow(row) : undefined;
}
