import type { D1Database } from "@cloudflare/workers-types";
import { paginate, pageSize } from "./pagination.ts";
import type { Cursor, PageInput, PagedRows } from "./pagination.ts";

export type SourceKind = "rss" | "sitemap" | "api" | "manual";
export type RightsStatus = "clear" | "licensed" | "unknown";
export type AllowStatus = "approved" | "denied" | "pending";

export interface SourceRow extends Cursor {
  id: string;
  name: string;
  originUrl: string;
  kind: SourceKind;
  rightsStatus: RightsStatus;
  allowStatus: AllowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewSource {
  id: string;
  name: string;
  originUrl: string;
  kind: SourceKind;
  rightsStatus?: RightsStatus;
  allowStatus?: AllowStatus;
  now?: string;
}

const SOURCE_SELECT = `
  SELECT id, name, origin_url AS originUrl, kind,
         rights_status AS rightsStatus, allow_status AS allowStatus,
         created_at AS createdAt, updated_at AS updatedAt
  FROM sources
`;

export async function createSource(
  db: D1Database,
  input: NewSource,
): Promise<SourceRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO sources
         (id, name, origin_url, kind, rights_status, allow_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.name,
      input.originUrl,
      input.kind,
      input.rightsStatus ?? "unknown",
      input.allowStatus ?? "pending",
      now,
      now,
    )
    .run();
  const row = await getSource(db, input.id);
  if (!row) throw new Error("source not found after insert");
  return row;
}

export async function getSource(
  db: D1Database,
  id: string,
): Promise<SourceRow | undefined> {
  const row = await db
    .prepare(`${SOURCE_SELECT} WHERE id = ?`)
    .bind(id)
    .first<SourceRow>();
  return row ?? undefined;
}

export async function listSources(
  db: D1Database,
  input: PageInput = {},
): Promise<PagedRows<SourceRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${SOURCE_SELECT} WHERE (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<SourceRow>()
      ).results
    : (
        await db
          .prepare(`${SOURCE_SELECT} ORDER BY created_at ASC, id ASC LIMIT ?`)
          .bind(limit + 1)
          .all<SourceRow>()
      ).results;
  return paginate(results, limit);
}

export async function setSourceAllowStatus(
  db: D1Database,
  id: string,
  allowStatus: AllowStatus,
): Promise<SourceRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare("UPDATE sources SET allow_status = ?, updated_at = ? WHERE id = ?")
    .bind(allowStatus, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getSource(db, id);
}
