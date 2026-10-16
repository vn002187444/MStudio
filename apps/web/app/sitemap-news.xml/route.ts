import { apiBaseUrl } from "../../lib/api";
import {
  buildNewsSitemap,
  isWithinNewsWindow,
  siteOrigin,
} from "../../lib/seo";
import type { NewsSitemapEntry } from "../../lib/seo";

/**
 * /sitemap-news.xml (Google News) — bài published trong cửa sổ 48h
 * theo NEWS_WINDOW_MS của packages/seo. Publication name/ ngôn ngữ
 * theo brand (vi).
 */
interface PublishedArticle {
  id: string;
  slug?: string;
  title: string;
  updatedAt: string;
}

export async function GET() {
  const origin = siteOrigin();
  const entries: NewsSitemapEntry[] = [];

  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=100`, {
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const payload = (await response.json()) as { rows?: PublishedArticle[] };
      for (const article of payload.rows ?? []) {
        if (!isWithinNewsWindow(article.updatedAt)) continue;
        entries.push({
          loc: `${origin}/bai-viet/${article.slug || article.id}`,
          title: article.title,
          publicationDate: article.updatedAt,
          publicationName: "MStudio Channel",
          language: "vi",
        });
      }
    }
  } catch {
    // API down: news sitemap rỗng (không 500).
  }

  return new Response(buildNewsSitemap(entries), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
