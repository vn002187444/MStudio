import type { D1Database } from "@cloudflare/workers-types";
import {
  getArticleSourceMap,
  getReaderProfile,
  batchFetchRecommendationPools,
  listPublishedArticleIdsByEntities,
} from "@mstudio/db";

export type RecommendationPool =
  | "fresh"
  | "trending"
  | "followed"
  | "related";

export interface RecommendationCandidate {
  articleId: string;
  pool: RecommendationPool;
  score: number;
  reason: string;
}

export interface RecommendationInput {
  userId?: string;
  articleId?: string;
  limit?: number;
  since?: string;
}

export const DEFAULT_RECOMMENDATION_LIMIT = 20;
export const MAX_RECOMMENDATION_LIMIT = 100;
export const DEFAULT_TRENDING_WINDOW_HOURS = 24;
export const MAX_ARTICLES_PER_SOURCE = 2;

export const POOL_WEIGHTS: Record<RecommendationPool, number> = {
  followed: 0.35,
  trending: 0.3,
  fresh: 0.2,
  related: 0.15,
};

export const POOL_REASONS: Record<RecommendationPool, string> = {
  fresh: "Mới xuất bản",
  trending: "Đang được đọc nhiều",
  followed: "Theo chủ đề bạn theo dõi",
  related: "Liên quan đến bài đang đọc",
};

interface ScoredCandidate {
  articleId: string;
  pool: RecommendationPool;
  score: number;
}

interface PoolCandidate {
  articleId: string;
  pool: RecommendationPool;
  strength: number;
}

export async function buildRecommendations(
  db: D1Database,
  input: RecommendationInput = {},
): Promise<RecommendationCandidate[]> {
  const limit = Math.min(
    Math.max(1, input.limit ?? DEFAULT_RECOMMENDATION_LIMIT),
    MAX_RECOMMENDATION_LIMIT,
  );
  const since =
    input.since ??
    new Date(
      Date.now() - DEFAULT_TRENDING_WINDOW_HOURS * 60 * 60 * 1000,
    ).toISOString();
  const poolFetchSize = limit * 3;

  // ⚡ Bolt: Batch recommendation queries into a single D1 execution
  const [profile, { freshIds, trending, related }] = await Promise.all([
    input.userId
      ? getReaderProfile(db, input.userId)
      : Promise.resolve(undefined),
    batchFetchRecommendationPools(db, poolFetchSize, since, input.articleId),
  ]);

  const [followedIds, hiddenArticleIds] = await Promise.all([
    profile?.followedTopicIds.length
      ? listPublishedArticleIdsByEntities(
          db,
          profile.followedTopicIds,
          poolFetchSize,
        )
      : Promise.resolve([] as string[]),
    profile?.hiddenTopicIds.length
      ? listPublishedArticleIdsByEntities(
          db,
          profile.hiddenTopicIds,
          MAX_RECOMMENDATION_LIMIT,
        ).then(ids => new Set(ids))
      : Promise.resolve(new Set<string>()),
  ]);

  const poolCandidates: PoolCandidate[] = [];
  followedIds.forEach((articleId, index) =>
    poolCandidates.push({
      articleId,
      pool: "followed",
      strength: 1 - index / Math.max(followedIds.length, 1),
    }),
  );
  const maxEvents = trending[0]?.eventCount ?? 1;
  trending.forEach(({ articleId, eventCount }) =>
    poolCandidates.push({
      articleId,
      pool: "trending",
      strength: Math.min(1, eventCount / maxEvents),
    }),
  );
  freshIds.forEach((articleId, index) =>
    poolCandidates.push({
      articleId,
      pool: "fresh",
      strength: 1 - index / Math.max(freshIds.length, 1),
    }),
  );
  const maxShared = related[0]?.sharedEntities ?? 1;
  related.forEach(({ articleId, sharedEntities }) =>
    poolCandidates.push({
      articleId,
      pool: "related",
      strength: Math.min(1, sharedEntities / maxShared),
    }),
  );

  const best = new Map<string, PoolCandidate>();
  for (const candidate of poolCandidates) {
    if (hiddenArticleIds.has(candidate.articleId)) continue;
    const existing = best.get(candidate.articleId);
    const score = POOL_WEIGHTS[candidate.pool] + candidate.strength;
    if (
      existing === undefined ||
      score >
        POOL_WEIGHTS[existing.pool] + existing.strength
    ) {
      best.set(candidate.articleId, candidate);
    }
  }

  const scored: ScoredCandidate[] = [...best.values()].map(
    (candidate) => ({
      articleId: candidate.articleId,
      pool: candidate.pool,
      score:
        POOL_WEIGHTS[candidate.pool] + candidate.strength,
    }),
  );
  scored.sort(
    (a, b) => b.score - a.score || a.articleId.localeCompare(b.articleId),
  );

  const sourceMap = await getArticleSourceMap(
    db,
    scored.map((candidate) => candidate.articleId),
  );
  const perSourceCount = new Map<string, number>();
  const candidates: RecommendationCandidate[] = [];
  for (const candidate of scored) {
    if (candidates.length >= limit) break;
    if (candidate.articleId === input.articleId) continue;
    const sourceId = sourceMap.get(candidate.articleId);
    if (sourceId) {
      const used = perSourceCount.get(sourceId) ?? 0;
      if (used >= MAX_ARTICLES_PER_SOURCE) continue;
      perSourceCount.set(sourceId, used + 1);
    }
    candidates.push({
      articleId: candidate.articleId,
      pool: candidate.pool,
      score: candidate.score,
      reason: POOL_REASONS[candidate.pool],
    });
  }
  return candidates;
}
