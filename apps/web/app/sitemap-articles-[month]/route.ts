import { apiBaseUrl } from "../../lib/api";
import { buildSitemap, siteOrigin } from "../../lib/seo";
import type { SitemapEntry } from "../../lib/seo";

/**
 * /sitemap-articles-YYYY-MM.xml (PLAN machine endpoints) — bài theo
 * tháng theo updatedAt. `month` bắt buộc khớp YYYY-MM.
 */
interface PublishedArticle {
  id: string;
  updatedAt: string;
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> | { month: string } },
) {
  const { month } = await Promise.resolve(params);
  if (!MONTH_RE.test(month)) {
    return new Response("invalid month", { status: 400 });
  }
  const origin = siteOrigin();
  const entries: SitemapEntry[] = [];

  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=200`, {
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const payload = (await response.json()) as { rows?: PublishedArticle[] };
      for (const article of payload.rows ?? []) {
        if (!article.updatedAt.startsWith(month)) continue;
        entries.push({
          loc: `${origin}/bai-viet/${article.id}`,
          lastmod: article.updatedAt,
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // API down: sitemap tháng rỗng (không 500).
  }

  return new Response(buildSitemap(entries), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
