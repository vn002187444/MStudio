import { apiBaseUrl } from "../../lib/api";
import { buildSitemap, siteOrigin } from "../../lib/seo";
import type { SitemapEntry } from "../../lib/seo";

/**
 * /sitemap-categories.xml — slugs active từ GET /categories (DB-backed,
 * MST-071). Pages đang noindex (chờ article↔category filter) vẫn list
 * được — Google tự tôn trọng meta robots, không index page rỗng.
 */
interface CategoryRow {
  slug: string;
  status: string;
}

export async function GET() {
  const origin = siteOrigin();
  const entries: SitemapEntry[] = [];

  try {
    const response = await fetch(`${apiBaseUrl()}/categories`, {
      next: { revalidate: 3600 },
    });
    if (response.ok) {
      const payload = (await response.json()) as { categories?: CategoryRow[] };
      for (const category of payload.categories ?? []) {
        if (category.status !== "active") continue;
        if (!/^[a-z0-9-]+$/.test(category.slug)) continue;
        entries.push({
          loc: `${origin}/${category.slug}`,
          changefreq: "daily",
          priority: 0.8,
        });
      }
    }
  } catch {
    // API down: sitemap categories rỗng (không 500).
  }

  return new Response(buildSitemap(entries), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
