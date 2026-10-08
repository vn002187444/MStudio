import type { D1Database } from "@cloudflare/workers-types";
import type { StoryRecord, StoryStatus } from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type { StoryStatus };

export type StoryRow = StoryRecord;

interface StoryRowRaw {
  id: string;
  title: string;
  summary: string | null;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewStory {
  id: string;
  title: string;
  summary?: string;
  status?: StoryStatus;
  now?: string;
}

const STORY_SELECT = `
  SELECT id, title, summary, status,
         created_at AS createdAt, updated_at AS updatedAt
  FROM stories
`;

function toStoryRow(row: StoryRowRaw): StoryRow {
  return { ...row, summary: row.summary ?? undefined };
}

export async function createStory(
  db: D1Database,
  input: NewStory,
): Promise<StoryRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO stories (id, title, summary, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.title,
      input.summary ?? null,
      input.status ?? "draft",
      now,
      now,
    )
    .run();
  const row = await getStory(db, input.id);
  if (!row) throw new Error("story not found after insert");
  return row;
}

export async function getStory(
  db: D1Database,
  id: string,
): Promise<StoryRow | undefined> {
  const row = await db
    .prepare(`${STORY_SELECT} WHERE id = ?`)
    .bind(id)
    .first<StoryRowRaw>();
  return row ? toStoryRow(row) : undefined;
}

export async function listStories(
  db: D1Database,
  input: PageInput = {},
): Promise<PagedRows<StoryRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${STORY_SELECT} WHERE (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<StoryRowRaw>()
      ).results
    : (
        await db
          .prepare(`${STORY_SELECT} ORDER BY created_at ASC, id ASC LIMIT ?`)
          .bind(limit + 1)
          .all<StoryRowRaw>()
      ).results;
  return paginate(results.map(toStoryRow), limit);
}

export async function updateStory(
  db: D1Database,
  id: string,
  patch: { title?: string; summary?: string },
): Promise<StoryRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE stories
       SET title = COALESCE(?, title),
           summary = COALESCE(?, summary),
           updated_at = ?
       WHERE id = ?`,
    )
    .bind(patch.title ?? null, patch.summary ?? null, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getStory(db, id);
}

export async function updateStoryStatus(
  db: D1Database,
  id: string,
  status: StoryStatus,
): Promise<StoryRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      "UPDATE stories SET status = ?, updated_at = ? WHERE id = ?",
    )
    .bind(status, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getStory(db, id);
}
