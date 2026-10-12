import { siteOrigin } from "../../lib/seo";

/**
 * robots.txt (PLAN machine endpoints) — mở toàn bộ cho crawler,
 * trỏ sitemap chính.
 */
export function GET() {
  const origin = siteOrigin();
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    `Sitemap: ${origin}/sitemap-news.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
