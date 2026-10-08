import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyMigration, createMigration } from "../migrations.ts";
import { openTestDatabase } from "./adapter.ts";

const here = dirname(fileURLToPath(import.meta.url));
const V1_SQL = readFileSync(
  join(here, "..", "..", "migrations", "0001_v1.sql"),
  "utf8",
);

export async function openMigratedTestDb(): Promise<{
  db: import("@cloudflare/workers-types").D1Database;
  close(): void;
}> {
  const testDb = openTestDatabase();
  const migration = createMigration("0001_v1", "core schema v1", V1_SQL);
  await applyMigration(testDb.db, migration);
  return testDb;
}
