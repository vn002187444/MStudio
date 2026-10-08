import type { D1Database } from "@cloudflare/workers-types";
import type {
  EntityKind,
  EntityRecord,
  StoryEntityRecord,
  StoryEntityRole,
} from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type { EntityKind, StoryEntityRole };

export type EntityRow = EntityRecord;
export type StoryEntityRow = StoryEntityRecord;

interface EntityRowRaw {
  id: string;
  name: string;
  kind: EntityKind;
  normalizedName: string;
  createdAt: string;
}

interface StoryEntityRowRaw {
  storyId: string;
  entityId: string;
  role: StoryEntityRole;
}

export interface NewEntity {
  id: string;
  name: string;
  kind: EntityKind;
  normalizedName?: string;
  now?: string;
}

const ENTITY_SELECT = `
  SELECT id, name, kind, normalized_name AS normalizedName,
         created_at AS createdAt
  FROM entities
`;

const STORY_ENTITY_SELECT = `
  SELECT story_id AS storyId, entity_id AS entityId, role
  FROM story_entities
`;

export function normalizeEntityName(name: string): string {
  return name.trim().toLowerCase();
}

export async function createEntity(
  db: D1Database,
  input: NewEntity,
): Promise<{ row: EntityRow; created: boolean }> {
  const now = input.now ?? new Date().toISOString();
  const normalizedName =
    input.normalizedName ?? normalizeEntityName(input.name);
  const existing = await findEntityByNormalizedName(
    db,
    normalizedName,
    input.kind,
  );
  if (existing) {
    return { row: existing, created: false };
  }
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO entities
         (id, name, kind, normalized_name, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(input.id, input.name, input.kind, normalizedName, now)
    .run();
  if (result.meta.changes === 0) {
    const race = await findEntityByNormalizedName(
      db,
      normalizedName,
      input.kind,
    );
    if (race) return { row: race, created: false };
    throw new Error("entity insert ignored without match");
  }
  const row = await findEntityByNormalizedName(
    db,
    normalizedName,
    input.kind,
  );
  if (!row) throw new Error("entity not found after insert");
  return { row, created: true };
}

export async function getEntity(
  db: D1Database,
  id: string,
): Promise<EntityRow | undefined> {
  const row = await db
    .prepare(`${ENTITY_SELECT} WHERE id = ?`)
    .bind(id)
    .first<EntityRowRaw>();
  return row ?? undefined;
}

export async function listEntities(
  db: D1Database,
  input: PageInput = {},
): Promise<PagedRows<EntityRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${ENTITY_SELECT} WHERE (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<EntityRowRaw>()
      ).results
    : (
        await db
          .prepare(`${ENTITY_SELECT} ORDER BY created_at ASC, id ASC LIMIT ?`)
          .bind(limit + 1)
          .all<EntityRowRaw>()
      ).results;
  return paginate(results, limit);
}

export async function addStoryEntity(
  db: D1Database,
  input: {
    storyId: string;
    entityId: string;
    role?: StoryEntityRole;
  },
): Promise<boolean> {
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO story_entities (story_id, entity_id, role)
       VALUES (?, ?, ?)`,
    )
    .bind(input.storyId, input.entityId, input.role ?? "subject")
    .run();
  return result.meta.changes > 0;
}

export async function listStoryEntities(
  db: D1Database,
  storyId: string,
): Promise<StoryEntityRow[]> {
  const rows = (
    await db
      .prepare(
        `${STORY_ENTITY_SELECT} WHERE story_id = ? ORDER BY entity_id ASC, role ASC`,
      )
      .bind(storyId)
      .all<StoryEntityRowRaw>()
  ).results;
  return rows.map((row) => ({ ...row }));
}

export async function removeStoryEntity(
  db: D1Database,
  storyId: string,
  entityId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      "DELETE FROM story_entities WHERE story_id = ? AND entity_id = ?",
    )
    .bind(storyId, entityId)
    .run();
  return result.meta.changes > 0;
}

async function findEntityByNormalizedName(
  db: D1Database,
  normalizedName: string,
  kind: EntityKind,
): Promise<EntityRow | undefined> {
  const row = await db
    .prepare(
      `${ENTITY_SELECT} WHERE normalized_name = ? AND kind = ?`,
    )
    .bind(normalizedName, kind)
    .first<EntityRowRaw>();
  return row ?? undefined;
}
