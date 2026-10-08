import type { D1Database } from "@cloudflare/workers-types";
import { updateFeedFetchResult } from "@mstudio/db";
import type { Logger } from "@mstudio/observability";

export interface FetchableFeed {
  id: string;
  sourceId: string;
  url: string;
  format: string;
}

export interface NormalizeJobMessage {
  feedId: string;
  hash: string;
  fetchedAt: string;
  byteLength: number;
}

export interface SchedulerResult {
  feeds: number;
  enqueued: number;
  duplicates: number;
  failed: number;
}

export interface SchedulerOptions {
  pageSize?: number;
  fetchTimeoutMs?: number;
}

export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

interface ApprovedFeedRow extends FetchableFeed {
  createdAt: string;
}

interface FeedCursor {
  createdAt: string;
  id: string;
}

const APPROVED_FEEDS_SQL = `
  SELECT f.id AS id, f.source_id AS sourceId, f.url AS url,
         f.format AS format, f.created_at AS createdAt
  FROM feeds AS f
  JOIN sources AS s ON s.id = f.source_id
  WHERE f.enabled = 1
    AND s.allow_status = 'approved'
`;

export async function listApprovedFeeds(
  db: D1Database,
  pageSize = DEFAULT_PAGE_SIZE,
  cursor?: FeedCursor,
): Promise<{ feeds: FetchableFeed[]; nextCursor?: FeedCursor }> {
  const limit = pageSize + 1;
  const sql = cursor
    ? `${APPROVED_FEEDS_SQL}
       AND (f.created_at, f.id) > (?, ?)
       ORDER BY f.created_at ASC, f.id ASC
       LIMIT ?`
    : `${APPROVED_FEEDS_SQL}
       ORDER BY f.created_at ASC, f.id ASC
       LIMIT ?`;
  const rows = cursor
    ? (
        await db
          .prepare(sql)
          .bind(cursor.createdAt, cursor.id, limit)
          .all<ApprovedFeedRow>()
      ).results
    : (
        await db.prepare(sql).bind(limit).all<ApprovedFeedRow>()
      ).results;
  const hasMore = rows.length > pageSize;
  const trimmed = hasMore ? rows.slice(0, pageSize) : rows;
  const last = trimmed[trimmed.length - 1];
  const feeds = trimmed.map(
    ({ createdAt: _createdAt, ...feed }) => feed,
  );
  return {
    feeds,
    nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : undefined,
  };
}

export async function sha256Hex(body: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function fetchFeedContent(
  url: string,
  timeoutMs: number,
): Promise<{ body: string; contentType: string }> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  const body = await response.text();
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  return { body, contentType };
}

export async function processFeed(
  feed: FetchableFeed,
  env: Env,
  options: { fetchTimeoutMs?: number } = {},
): Promise<"enqueued" | "duplicate"> {
  const bucket = env.RAW_BUCKET;
  const queue = env.NORMALIZE_QUEUE;
  if (!bucket || !queue) {
    throw new Error(
      "RAW_BUCKET and NORMALIZE_QUEUE bindings must be configured",
    );
  }
  const timeoutMs = options.fetchTimeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const { body, contentType } = await fetchFeedContent(feed.url, timeoutMs);
  const hash = await sha256Hex(body);
  const existing = await bucket.get(hash);
  if (existing) {
    return "duplicate";
  }
  await bucket.put(hash, body, {
    httpMetadata: { contentType },
  });
  const message: NormalizeJobMessage = {
    feedId: feed.id,
    hash,
    fetchedAt: new Date().toISOString(),
    byteLength: new TextEncoder().encode(body).length,
  };
  await queue.send(message);
  return "enqueued";
}

export async function runScheduler(
  env: Env,
  logger: Logger,
  options: SchedulerOptions = {},
): Promise<SchedulerResult> {
  const db = env.DB;
  if (!db) {
    throw new Error("DB binding must be configured");
  }
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const result: SchedulerResult = {
    feeds: 0,
    enqueued: 0,
    duplicates: 0,
    failed: 0,
  };
  let cursor: FeedCursor | undefined;
  do {
    const page = await listApprovedFeeds(db, pageSize, cursor);
    result.feeds += page.feeds.length;
    for (const feed of page.feeds) {
      const fetchedAt = new Date().toISOString();
      try {
        const outcome = await processFeed(feed, env, {
          fetchTimeoutMs: options.fetchTimeoutMs,
        });
        if (outcome === "duplicate") {
          result.duplicates += 1;
        } else {
          result.enqueued += 1;
        }
        await updateFeedFetchResult(db, feed.id, { fetchedAt });
      } catch (error) {
        result.failed += 1;
        const message =
          error instanceof Error ? error.message : "unknown error";
        logger.error("feed_fetch_failed", {
          feedId: feed.id,
          url: feed.url,
          code: "FETCH_FAILED",
          message,
        });
        await updateFeedFetchResult(db, feed.id, {
          fetchedAt,
          error: message,
        });
      }
    }
    cursor = page.nextCursor;
  } while (cursor);
  logger.info("scheduler_complete", {
    feeds: result.feeds,
    enqueued: result.enqueued,
    duplicates: result.duplicates,
    failed: result.failed,
  });
  return result;
}
