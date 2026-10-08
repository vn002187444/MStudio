import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { D1Database } from "@cloudflare/workers-types";
import { applyMigration, createMigration } from "../migrations.ts";
import { openTestDatabase } from "./adapter.ts";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "..", "migrations");

export async function openMigratedTestDb(): Promise<{
  db: D1Database;
  close(): void;
}> {
  const testDb = openTestDatabase();
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await applyMigration(testDb.db, createMigration(file, file, sql));
  }
  return testDb;
}
