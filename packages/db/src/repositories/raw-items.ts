import type { D1Database } from "@cloudflare/workers-types";
import type { RawItemRecord, RawItemStatus } from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type { RawItemStatus };

export type RawItemRow = RawItemRecord;

interface RawItemRowRaw {
  id: string;
  feedId: string;
  sourceId: string;
  externalId: string | null;
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  payloadHash: string;
  status: RawItemStatus;
  createdAt: string;
}

export interface NewRawItem {
  id: string;
  feedId: string;
  sourceId: string;
  externalId?: string;
  url: string;
  canonicalUrl?: string;
  title?: string;
  publishedAt?: string;
  fetchedAt: string;
  payloadHash: string;
}

const RAW_ITEM_SELECT = `
  SELECT id, feed_id AS feedId, source_id AS sourceId, external_id AS externalId,
         url, canonical_url AS canonicalUrl, title, published_at AS publishedAt,
         fetched_at AS fetchedAt, payload_hash AS payloadHash, status,
         created_at AS createdAt
  FROM raw_items
`;

function toRawItemRow(row: RawItemRowRaw): RawItemRow {
  return {
    ...row,
    externalId: row.externalId ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    title: row.title ?? undefined,
    publishedAt: row.publishedAt ?? undefined,
  };
}

export async function createRawItem(
  db: D1Database,
  input: NewRawItem,
): Promise<{ row: RawItemRow; created: boolean }> {
  const now = new Date().toISOString();

  if (input.externalId === undefined) {
    const existing = await findRawItemByPayloadHash(
      db,
      input.feedId,
      input.payloadHash,
    );
    if (existing) return { row: existing, created: false };
  }

  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO raw_items
         (id, feed_id, source_id, external_id, url, canonical_url, title,
          published_at, fetched_at, payload_hash, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'incoming', ?)`,
    )
    .bind(
      input.id,
      input.feedId,
      input.sourceId,
      input.externalId ?? null,
      input.url,
      input.canonicalUrl ?? null,
      input.title ?? null,
      input.publishedAt ?? null,
      input.fetchedAt,
      input.payloadHash,
      now,
    )
    .run();

  if (result.meta.changes === 0) {
    const existing =
      input.externalId !== undefined
        ? await findRawItemByExternalId(db, input.feedId, input.externalId)
        : await findRawItemByPayloadHash(db, input.feedId, input.payloadHash);
    if (existing) return { row: existing, created: false };
    throw new Error("insert ignored but no existing raw item found");
  }

  const row = await getRawItem(db, input.id);
  if (!row) throw new Error("raw item not found after insert");
  return { row, created: true };
}

export async function getRawItem(
  db: D1Database,
  id: string,
): Promise<RawItemRow | undefined> {
  const row = await db
    .prepare(`${RAW_ITEM_SELECT} WHERE id = ?`)
    .bind(id)
    .first<RawItemRowRaw>();
  return row ? toRawItemRow(row) : undefined;
}

async function findRawItemByExternalId(
  db: D1Database,
  feedId: string,
  externalId: string,
): Promise<RawItemRow | undefined> {
  const row = await db
    .prepare(`${RAW_ITEM_SELECT} WHERE feed_id = ? AND external_id = ?`)
    .bind(feedId, externalId)
    .first<RawItemRowRaw>();
  return row ? toRawItemRow(row) : undefined;
}

async function findRawItemByPayloadHash(
  db: D1Database,
  feedId: string,
  payloadHash: string,
): Promise<RawItemRow | undefined> {
  const row = await db
    .prepare(`${RAW_ITEM_SELECT} WHERE feed_id = ? AND payload_hash = ?`)
    .bind(feedId, payloadHash)
    .first<RawItemRowRaw>();
  return row ? toRawItemRow(row) : undefined;
}

export async function listRawItemsByFeed(
  db: D1Database,
  feedId: string,
  input: PageInput = {},
): Promise<PagedRows<RawItemRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${RAW_ITEM_SELECT} WHERE feed_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(feedId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<RawItemRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${RAW_ITEM_SELECT} WHERE feed_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(feedId, limit + 1)
          .all<RawItemRowRaw>()
      ).results;
  return paginate(results.map(toRawItemRow), limit);
}

export async function listRawItemsByStatus(
  db: D1Database,
  status: RawItemStatus,
  input: PageInput = {},
): Promise<PagedRows<RawItemRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${RAW_ITEM_SELECT} WHERE status = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<RawItemRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${RAW_ITEM_SELECT} WHERE status = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(status, limit + 1)
          .all<RawItemRowRaw>()
      ).results;
  return paginate(results.map(toRawItemRow), limit);
}

export async function countRawItemsByStatus(
  db: D1Database,
  status: RawItemStatus,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM raw_items WHERE status = ?")
    .bind(status)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function setRawItemStatus(
  db: D1Database,
  id: string,
  status: RawItemStatus,
): Promise<RawItemRow | undefined> {
  const result = await db
    .prepare("UPDATE raw_items SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
  if (result.meta.changes === 0) return undefined;
  return getRawItem(db, id);
}
