import { fetchApi } from "../../lib/api";
import {
  buildLlmsTxt,
  siteOrigin,
  type LlmsArticleEntry,
  type LlmsCategoryEntry,
} from "../../lib/seo";

/**
 * /llms.txt (PLAN machine endpoints, MST-078 / FU-28)
 * Chuẩn khám phá nội dung sạch cho các hệ thống LLMs/AI (Perplexity, ChatGPT, Claude, Gemini).
 * Dynamic route handler lấy danh mục active & bài viết mới nhất từ MStudio API.
 */
export const revalidate = 3600; // Cache 1 giờ (ISR)

export async function GET() {
  const origin = siteOrigin();
  const categories: LlmsCategoryEntry[] = [];
  const articles: LlmsArticleEntry[] = [];

  // 1. Fetch danh mục hoạt động
  try {
    const resCat = await fetchApi("/categories", {
      next: { revalidate: 3600 },
    });
    if (resCat.ok) {
      const payload = (await resCat.json()) as {
        categories?: Array<{ slug: string; labelVi: string; status: string }>;
      };
      for (const cat of payload.categories ?? []) {
        if (cat.status === "active" && /^[a-z0-9-]+$/.test(cat.slug)) {
          categories.push({
            slug: cat.slug,
            name: cat.labelVi || cat.slug,
          });
        }
      }
    }
  } catch {
    // API down: phục vụ fallback không throw 500
  }

  // 2. Fetch danh sách bài viết mới nhất
  try {
    const resArt = await fetchApi("/articles?limit=30", {
      next: { revalidate: 300 },
    });
    if (resArt.ok) {
      const payload = (await resArt.json()) as {
        rows?: Array<{
          id: string;
          slug?: string;
          title: string;
          summary?: string;
          categorySlug?: string;
          updatedAt?: string;
        }>;
      };
      for (const row of payload.rows ?? []) {
        articles.push({
          id: row.id,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          categorySlug: row.categorySlug,
          updatedAt: row.updatedAt,
        });
      }
    }
  } catch {
    // API down: phục vụ fallback không throw 500
  }

  const markdown = buildLlmsTxt({
    siteOrigin: origin,
    siteTitle: "MStudio Channel",
    categories,
    articles,
  });

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
