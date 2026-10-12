import { apiBaseUrl } from "../../lib/api";
import { buildSitemap, siteOrigin } from "../../lib/seo";
import type { SitemapEntry } from "../../lib/seo";

/**
 * /sitemap.xml (PLAN machine endpoints) — routes công khai + bài
 * published gần nhất từ GET /articles. Free-tier: giới hạn 200 bài
 * mới nhất, monthly sitemap tách riêng khi quy mô lớn.
 */
const STATIC_PATHS: Array<{ loc: string; changefreq: SitemapEntry["changefreq"]; priority: number }> = [
  { loc: "/", changefreq: "hourly", priority: 1.0 },
  { loc: "/moi-nhat/", changefreq: "hourly", priority: 0.9 },
  { loc: "/dang-nong/", changefreq: "hourly", priority: 0.8 },
  { loc: "/danh-cho-ban/", changefreq: "daily", priority: 0.6 },
];

interface PublishedArticle {
  id: string;
  updatedAt: string;
}

export async function GET() {
  const origin = siteOrigin();
  const entries: SitemapEntry[] = STATIC_PATHS.map((item) => ({
    loc: `${origin}${item.loc}`,
    changefreq: item.changefreq,
    priority: item.priority,
  }));

  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=200`, {
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const payload = (await response.json()) as { rows?: PublishedArticle[] };
      for (const article of payload.rows ?? []) {
        entries.push({
          loc: `${origin}/bai-viet/${article.id}`,
          lastmod: article.updatedAt,
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // API down: sitemap vẫn serve routes tĩnh (không 500).
  }

  return new Response(buildSitemap(entries), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
