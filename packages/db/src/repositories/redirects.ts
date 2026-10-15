import type { D1Database } from "@cloudflare/workers-types";
import type { RedirectRecord } from "@mstudio/contracts";

export async function createRedirect(
  db: D1Database,
  redirect: Omit<RedirectRecord, "hits">,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO redirects (id, from_path, to_path, status_code, hits, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      redirect.id,
      redirect.fromPath,
      redirect.toPath,
      redirect.statusCode,
      0,
      redirect.createdAt,
      redirect.updatedAt,
    )
    .run();
}

export async function listRedirects(
  db: D1Database,
): Promise<RedirectRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, from_path as fromPath, to_path as toPath, status_code as statusCode, hits, created_at as createdAt, updated_at as updatedAt FROM redirects ORDER BY created_at DESC`,
    )
    .all<RedirectRecord>();
  return results ?? [];
}

export async function getRedirectByFromPath(
  db: D1Database,
  fromPath: string,
): Promise<RedirectRecord | null> {
  const redirect = await db
    .prepare(
      `SELECT id, from_path as fromPath, to_path as toPath, status_code as statusCode, hits, created_at as createdAt, updated_at as updatedAt FROM redirects WHERE from_path = ?`,
    )
    .bind(fromPath)
    .first<RedirectRecord>();
  return redirect ?? null;
}

export async function deleteRedirect(
  db: D1Database,
  id: string,
): Promise<void> {
  await db.prepare(`DELETE FROM redirects WHERE id = ?`).bind(id).run();
}

export async function incrementRedirectHits(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare(`UPDATE redirects SET hits = hits + 1 WHERE id = ?`)
    .bind(id)
    .run();
}
