/**
 * Shared article fetchers cho public feeds (moi-nhat, dang-nong).
 * Layer content theo PLAN repository structure (lib/content/).
 */
import { apiBaseUrl, fetchApi } from "../api";

export interface PublishedArticle {
  id: string;
  storyId: string;
  status: string;
  title: string;
  summary?: string;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  updatedAt: string;
  createdAt: string;
}

interface ArticlesResponse {
  rows: PublishedArticle[];
  nextCursor?: { createdAt: string; id: string };
}

interface RecommendationsResponse {
  candidates: Array<{
    articleId: string;
    pool: "fresh" | "trending" | "followed" | "related";
    score: number;
    reason: string;
  }>;
}

/** Bài published mới nhất, lỗi mạng trả [] (trang có empty state). */
export async function fetchLatestArticles(limit = 10): Promise<PublishedArticle[]> {
  try {
    const response = await fetchApi(`/articles?limit=${limit}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

/** Một bài theo id (dùng resolve trending candidates). */
export async function fetchArticleById(id: string): Promise<PublishedArticle | undefined> {
  try {
    const response = await fetchApi(
      `/articles/${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return undefined;
    const payload = (await response.json()) as { article?: PublishedArticle };
    return payload.article;
  } catch {
    return undefined;
  }
}

/**
 * Đang nóng: pool trending từ GET /recommendations (reader events window),
 * resolve song song tối đa `limit` bài. Fallback sang bài mới nhất nếu chưa
 * đủ event để trang luôn có nội dung đầy đủ.
 */
export async function fetchTrendingArticles(limit = 8): Promise<PublishedArticle[]> {
  try {
    const response = await fetchApi(
      `/recommendations?limit=${limit * 2}`,
      { next: { revalidate: 60 } },
    );
    let trendingArticles: PublishedArticle[] = [];
    if (response.ok) {
      const payload = (await response.json()) as RecommendationsResponse;
      const trendingIds = (payload.candidates ?? [])
        .filter((candidate) => candidate.pool === "trending")
        .slice(0, limit)
        .map((candidate) => candidate.articleId);
      if (trendingIds.length > 0) {
        const resolved = await Promise.all(trendingIds.map((id) => fetchArticleById(id)));
        trendingArticles = resolved.filter((article): article is PublishedArticle => article !== undefined);
      }
    }

    if (trendingArticles.length < limit) {
      const latest = await fetchLatestArticles(limit);
      const existingIds = new Set(trendingArticles.map((a) => a.id));
      for (const item of latest) {
        if (!existingIds.has(item.id)) {
          trendingArticles.push(item);
          existingIds.add(item.id);
          if (trendingArticles.length >= limit) break;
        }
      }
    }

    return trendingArticles;
  } catch {
    return fetchLatestArticles(limit);
  }
}
