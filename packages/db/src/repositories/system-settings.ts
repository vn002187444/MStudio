import type { D1Database } from "@cloudflare/workers-types";
import type { SystemSettingRecord } from "@mstudio/contracts";

export async function setSystemSetting(
  db: D1Database,
  key: string,
  value: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(key, value, now)
    .run();
}

export async function getSystemSetting(
  db: D1Database,
  key: string,
): Promise<SystemSettingRecord | null> {
  const setting = await db
    .prepare(
      `SELECT key, value, updated_at as updatedAt FROM system_settings WHERE key = ?`,
    )
    .bind(key)
    .first<SystemSettingRecord>();
  return setting ?? null;
}
