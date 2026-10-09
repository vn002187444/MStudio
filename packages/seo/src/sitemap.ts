import type {
  NewsSitemapEntry,
  SitemapEntry,
  SitemapEvent,
  SitemapEventKind,
} from "@mstudio/contracts";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => {
    const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`];
    if (entry.lastmod !== undefined) {
      parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    }
    if (entry.changefreq !== undefined) {
      parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    if (entry.priority !== undefined) {
      parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    }
    return `  <url>\n${parts.join("\n")}\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export function buildNewsSitemap(entries: NewsSitemapEntry[]): string {
  const urls = entries.map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(entry.publicationName)}</news:name>
        <news:language>${escapeXml(entry.language ?? "en")}</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(entry.publicationDate)}</news:publication_date>
      <news:title>${escapeXml(entry.title)}</news:title>
    </news:news>
  </url>`,
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

export const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isWithinNewsWindow(
  publishedAt: string,
  now: number = Date.now(),
): boolean {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  return now - published <= NEWS_WINDOW_MS;
}

export function buildSitemapEvent(
  kind: SitemapEventKind,
  url: string,
  lastmod: string = new Date().toISOString(),
): SitemapEvent {
  return { kind, url, lastmod };
}
