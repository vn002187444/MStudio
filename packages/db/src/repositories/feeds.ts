import type { D1Database } from "@cloudflare/workers-types";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type FeedFormat = "rss" | "atom" | "jsonfeed" | "sitemap";

interface FeedRowRaw {
  id: string;
  sourceId: string;
  url: string;
  format: FeedFormat;
  enabled: number;
  fetchIntervalSeconds: number;
  lastFetchedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedRow {
  id: string;
  sourceId: string;
  url: string;
  format: FeedFormat;
  enabled: boolean;
  fetchIntervalSeconds: number;
  lastFetchedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewFeed {
  id: string;
  sourceId: string;
  url: string;
  format: FeedFormat;
  fetchIntervalSeconds?: number;
  now?: string;
}

const FEED_SELECT = `
  SELECT id, source_id AS sourceId, url, format, enabled,
         fetch_interval_seconds AS fetchIntervalSeconds,
         last_fetched_at AS lastFetchedAt, last_error AS lastError,
         created_at AS createdAt, updated_at AS updatedAt
  FROM feeds
`;

function toFeedRow(row: FeedRowRaw): FeedRow {
  return {
    ...row,
    enabled: row.enabled === 1,
    lastFetchedAt: row.lastFetchedAt ?? undefined,
    lastError: row.lastError ?? undefined,
  };
}

export async function createFeed(
  db: D1Database,
  input: NewFeed,
): Promise<FeedRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO feeds
         (id, source_id, url, format, fetch_interval_seconds, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.sourceId,
      input.url,
      input.format,
      input.fetchIntervalSeconds ?? 900,
      now,
      now,
    )
    .run();
  const row = await getFeed(db, input.id);
  if (!row) throw new Error("feed not found after insert");
  return row;
}

export async function getFeed(
  db: D1Database,
  id: string,
): Promise<FeedRow | undefined> {
  const row = await db
    .prepare(`${FEED_SELECT} WHERE id = ?`)
    .bind(id)
    .first<FeedRowRaw>();
  return row ? toFeedRow(row) : undefined;
}

export async function listFeedsBySource(
  db: D1Database,
  sourceId: string,
  input: PageInput = {},
): Promise<PagedRows<FeedRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${FEED_SELECT} WHERE source_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(sourceId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<FeedRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${FEED_SELECT} WHERE source_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(sourceId, limit + 1)
          .all<FeedRowRaw>()
      ).results;
  return paginate(results.map(toFeedRow), limit);
}

export async function setFeedEnabled(
  db: D1Database,
  id: string,
  enabled: boolean,
): Promise<FeedRow | undefined> {
  const now = new Date().toISOString();
  const result = await db
    .prepare("UPDATE feeds SET enabled = ?, updated_at = ? WHERE id = ?")
    .bind(enabled ? 1 : 0, now, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getFeed(db, id);
}

export async function updateFeedFetchResult(
  db: D1Database,
  id: string,
  result: { fetchedAt: string; error?: string },
): Promise<FeedRow | undefined> {
  const now = new Date().toISOString();
  const update = await db
    .prepare(
      "UPDATE feeds SET last_fetched_at = ?, last_error = ?, updated_at = ? WHERE id = ?",
    )
    .bind(result.fetchedAt, result.error ?? null, now, id)
    .run();
  if (update.meta.changes === 0) return undefined;
  return getFeed(db, id);
}
