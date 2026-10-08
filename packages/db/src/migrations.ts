import type { D1Database } from "@cloudflare/workers-types";

export interface Migration {
  id: string;
  name: string;
  sql: string;
}

export function createMigration(
  id: string,
  name: string,
  sql: string,
): Migration {
  return { id, name, sql };
}

export async function applyMigration(
  db: D1Database,
  migration: Migration,
): Promise<void> {
  await db.exec(migration.sql);
}
