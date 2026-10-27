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
    "Disallow: /search",
    "Disallow: /api/",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    `Sitemap: ${origin}/sitemap-news.xml`,
    "",
    `# LLMs & AI discovery: ${origin}/llms.txt`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
