import type { D1Database } from "@cloudflare/workers-types";

export interface TrendingArticleRow {
  articleId: string;
  eventCount: number;
}

export interface RelatedArticleRow {
  articleId: string;
  sharedEntities: number;
}

export async function listFreshArticleIds(
  db: D1Database,
  limit: number,
): Promise<string[]> {
  const rows = (
    await db
      .prepare(
        `SELECT id FROM articles
         WHERE status = 'published'
         ORDER BY updated_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<{ id: string }>()
  ).results;
  return rows.map((row) => row.id);
}

export async function listTrendingArticles(
  db: D1Database,
  since: string,
  limit: number,
): Promise<TrendingArticleRow[]> {
  const rows = (
    await db
      .prepare(
        `SELECT article_id AS articleId, COUNT(*) AS eventCount
         FROM reader_events
         WHERE article_id IS NOT NULL AND occurred_at >= ?
         GROUP BY article_id
         ORDER BY eventCount DESC, articleId ASC
         LIMIT ?`,
      )
      .bind(since, limit)
      .all<TrendingArticleRow>()
  ).results;
  return rows;
}

export async function listPublishedArticleIdsByEntities(
  db: D1Database,
  entityIds: string[],
  limit: number,
): Promise<string[]> {
  if (entityIds.length === 0) return [];
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = (
    await db
      .prepare(
        `SELECT DISTINCT a.id AS id
         FROM articles a
         JOIN story_entities se ON se.story_id = a.story_id
         WHERE se.entity_id IN (${placeholders}) AND a.status = 'published'
         ORDER BY a.updated_at DESC, a.id DESC
         LIMIT ?`,
      )
      .bind(...entityIds, limit)
      .all<{ id: string }>()
  ).results;
  return rows.map((row) => row.id);
}

export async function listRelatedArticles(
  db: D1Database,
  articleId: string,
  limit: number,
): Promise<RelatedArticleRow[]> {
  const rows = (
    await db
      .prepare(
        `SELECT a.id AS articleId, COUNT(*) AS sharedEntities
         FROM articles a
         JOIN story_entities se ON se.story_id = a.story_id
         WHERE se.entity_id IN (
             SELECT se0.entity_id
             FROM story_entities se0
             JOIN articles a0 ON a0.story_id = se0.story_id
             WHERE a0.id = ?
           )
           AND a.id != ? AND a.status = 'published'
         GROUP BY a.id
         ORDER BY sharedEntities DESC, a.updated_at DESC, a.id ASC
         LIMIT ?`,
      )
      .bind(articleId, articleId, limit)
      .all<RelatedArticleRow>()
  ).results;
  return rows;
}

export async function getArticleSourceMap(
  db: D1Database,
  articleIds: string[],
): Promise<Map<string, string | undefined>> {
  const sourceMap = new Map<string, string | undefined>(
    articleIds.map((id) => [id, undefined]),
  );
  if (articleIds.length === 0) return sourceMap;
  const placeholders = articleIds.map(() => "?").join(", ");
  const rows = (
    await db
      .prepare(
        `SELECT a.id AS articleId, f.source_id AS sourceId
         FROM articles a
         JOIN story_sources ss
           ON ss.story_id = a.story_id AND ss.role = 'primary'
         JOIN raw_items r ON r.id = ss.raw_item_id
         JOIN feeds f ON f.id = r.feed_id
         WHERE a.id IN (${placeholders})`,
      )
      .bind(...articleIds)
      .all<{ articleId: string; sourceId: string }>()
  ).results;
  for (const row of rows) {
    sourceMap.set(row.articleId, row.sourceId);
  }
  return sourceMap;
}

export async function batchFetchRecommendationPools(
  db: D1Database,
  limit: number,
  since: string,
  articleId?: string,
): Promise<{
  freshIds: string[];
  trending: TrendingArticleRow[];
  related: RelatedArticleRow[];
}> {
  const statements = [
    db
      .prepare(
        `SELECT id FROM articles
         WHERE status = 'published'
         ORDER BY updated_at DESC, id DESC
         LIMIT ?`,
      )
      .bind(limit),
    db
      .prepare(
        `SELECT article_id AS articleId, COUNT(*) AS eventCount
         FROM reader_events
         WHERE article_id IS NOT NULL AND occurred_at >= ?
         GROUP BY article_id
         ORDER BY eventCount DESC, articleId ASC
         LIMIT ?`,
      )
      .bind(since, limit),
  ];

  if (articleId) {
    statements.push(
      db
        .prepare(
          `SELECT a.id AS articleId, COUNT(*) AS sharedEntities
           FROM articles a
           JOIN story_entities se ON se.story_id = a.story_id
           WHERE se.entity_id IN (
               SELECT se0.entity_id
               FROM story_entities se0
               JOIN articles a0 ON a0.story_id = se0.story_id
               WHERE a0.id = ?
             )
             AND a.id != ? AND a.status = 'published'
           GROUP BY a.id
           ORDER BY sharedEntities DESC, a.updated_at DESC, a.id ASC
           LIMIT ?`,
        )
        .bind(articleId, articleId, limit)
    );
  }

  const results = await db.batch(statements);

  const freshIds = ((results[0].results ?? []) as { id: string }[]).map(row => row.id);
  const trending = (results[1].results ?? []) as unknown as TrendingArticleRow[];
  const related = articleId && results[2] ? ((results[2].results ?? []) as unknown as RelatedArticleRow[]) : [];

  return { freshIds, trending, related };
}


export async function batchFetchProfileArticleIds(
  db: D1Database,
  followedTopicIds: string[],
  followedLimit: number,
  hiddenTopicIds: string[],
  hiddenLimit: number,
): Promise<{
  followedIds: string[];
  hiddenIds: string[];
}> {
  const statements = [];

  if (followedTopicIds.length > 0) {
    const placeholders = followedTopicIds.map(() => "?").join(", ");
    statements.push(
      db
        .prepare(
          `SELECT DISTINCT a.id AS id
           FROM articles a
           JOIN story_entities se ON se.story_id = a.story_id
           WHERE se.entity_id IN (${placeholders}) AND a.status = 'published'
           ORDER BY a.updated_at DESC, a.id DESC
           LIMIT ?`,
        )
        .bind(...followedTopicIds, followedLimit)
    );
  }

  if (hiddenTopicIds.length > 0) {
    const placeholders = hiddenTopicIds.map(() => "?").join(", ");
    statements.push(
      db
        .prepare(
          `SELECT DISTINCT a.id AS id
           FROM articles a
           JOIN story_entities se ON se.story_id = a.story_id
           WHERE se.entity_id IN (${placeholders}) AND a.status = 'published'
           ORDER BY a.updated_at DESC, a.id DESC
           LIMIT ?`,
        )
        .bind(...hiddenTopicIds, hiddenLimit)
    );
  }

  if (statements.length === 0) {
    return { followedIds: [], hiddenIds: [] };
  }

  const results = await db.batch(statements);

  let followedIds: string[] = [];
  let hiddenIds: string[] = [];
  let resultIndex = 0;

  if (followedTopicIds.length > 0) {
    followedIds = ((results[resultIndex]?.results ?? []) as { id: string }[]).map(row => row.id);
    resultIndex++;
  }

  if (hiddenTopicIds.length > 0) {
    hiddenIds = ((results[resultIndex]?.results ?? []) as { id: string }[]).map(row => row.id);
  }

  return { followedIds, hiddenIds };
}
