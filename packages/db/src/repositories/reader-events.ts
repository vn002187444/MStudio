import type { D1Database } from "@cloudflare/workers-types";
import type {
  NewReaderEvent,
  ReaderEventRecord,
  ReaderProfileRecord,
} from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

const READER_EVENT_SELECT = `
  SELECT id, user_id AS userId, event_type AS eventType, article_id AS articleId,
         topic_id AS topicId, url, occurred_at AS occurredAt, created_at AS createdAt
  FROM reader_events
`;

interface ReaderEventRowRaw {
  id: string;
  userId: string | null;
  eventType: string;
  articleId: string | null;
  topicId: string | null;
  url: string | null;
  occurredAt: string;
  createdAt: string;
}

interface ReaderProfileRowRaw {
  userId: string;
  followedTopicIds: string;
  hiddenTopicIds: string;
  updatedAt: string;
}

function toReaderEventRecord(row: ReaderEventRowRaw): ReaderEventRecord {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    eventType: row.eventType,
    articleId: row.articleId ?? undefined,
    topicId: row.topicId ?? undefined,
    url: row.url ?? undefined,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function toReaderEventPage(
  rows: ReaderEventRowRaw[],
  limit: number,
): PagedRows<ReaderEventRecord> {
  return paginate(rows.map(toReaderEventRecord), limit);
}

function toReaderProfile(row: ReaderProfileRowRaw): ReaderProfileRecord {
  return {
    userId: row.userId,
    followedTopicIds: JSON.parse(row.followedTopicIds) as string[],
    hiddenTopicIds: JSON.parse(row.hiddenTopicIds) as string[],
    updatedAt: row.updatedAt,
  };
}

function mergeTopicIds(
  current: string[] | undefined,
  additions: string[] | undefined,
): string[] {
  const merged = new Set(current ?? []);
  for (const topicId of additions ?? []) {
    merged.add(topicId);
  }
  return [...merged];
}

export async function createReaderEvents(
  db: D1Database,
  events: NewReaderEvent[],
): Promise<void> {
  if (events.length === 0) return;
  const statements = events.map((event) =>
    db
      .prepare(
        `INSERT INTO reader_events
           (id, user_id, event_type, article_id, topic_id, url, occurred_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        event.id,
        event.userId ?? null,
        event.eventType,
        event.articleId ?? null,
        event.topicId ?? null,
        event.url ?? null,
        event.occurredAt,
        event.createdAt,
      ),
  );
  await db.batch(statements);
}

export async function listReaderEventsByArticle(
  db: D1Database,
  articleId: string,
  input: PageInput = {},
): Promise<PagedRows<ReaderEventRecord>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${READER_EVENT_SELECT} WHERE article_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(articleId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<ReaderEventRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${READER_EVENT_SELECT} WHERE article_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(articleId, limit + 1)
          .all<ReaderEventRowRaw>()
      ).results;
  return toReaderEventPage(results, limit);
}

export async function listReaderEventsByUser(
  db: D1Database,
  userId: string,
  input: PageInput = {},
): Promise<PagedRows<ReaderEventRecord>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${READER_EVENT_SELECT} WHERE user_id = ? AND (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(userId, input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<ReaderEventRowRaw>()
      ).results
    : (
        await db
          .prepare(
            `${READER_EVENT_SELECT} WHERE user_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(userId, limit + 1)
          .all<ReaderEventRowRaw>()
      ).results;
  return toReaderEventPage(results, limit);
}

export async function getReaderProfile(
  db: D1Database,
  userId: string,
): Promise<ReaderProfileRecord | undefined> {
  const row = await db
    .prepare(
      `SELECT user_id AS userId, followed_topic_ids AS followedTopicIds,
              hidden_topic_ids AS hiddenTopicIds, updated_at AS updatedAt
       FROM reader_profiles WHERE user_id = ?`,
    )
    .bind(userId)
    .first<ReaderProfileRowRaw>();
  return row ? toReaderProfile(row) : undefined;
}

export async function upsertReaderProfile(
  db: D1Database,
  userId: string,
  updates: { followedTopicIds?: string[]; hiddenTopicIds?: string[] },
  now: string,
): Promise<ReaderProfileRecord> {
  const existing = await getReaderProfile(db, userId);
  const followedTopicIds = mergeTopicIds(
    existing?.followedTopicIds,
    updates.followedTopicIds,
  );
  const hiddenTopicIds = mergeTopicIds(
    existing?.hiddenTopicIds,
    updates.hiddenTopicIds,
  );
  await db
    .prepare(
      `INSERT INTO reader_profiles (user_id, followed_topic_ids, hidden_topic_ids, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         followed_topic_ids = excluded.followed_topic_ids,
         hidden_topic_ids = excluded.hidden_topic_ids,
         updated_at = excluded.updated_at`,
    )
    .bind(userId, JSON.stringify(followedTopicIds), JSON.stringify(hiddenTopicIds), now)
    .run();
  return { userId, followedTopicIds, hiddenTopicIds, updatedAt: now };
}
