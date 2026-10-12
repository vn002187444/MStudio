import { apiBaseUrl } from "../../lib/api";
import { siteOrigin } from "../../lib/seo";

/**
 * /feed.xml (PLAN machine endpoints) — RSS 2.0 của 20 bài published
 * mới nhất. Escape XML thủ phạm nhỏ, không thêm dependency.
 */
interface PublishedArticle {
  id: string;
  title: string;
  summary?: string;
  updatedAt: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const origin = siteOrigin();
  const items: string[] = [];

  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=20`, {
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const payload = (await response.json()) as { rows?: PublishedArticle[] };
      for (const article of payload.rows ?? []) {
        const link = `${origin}/bai-viet/${article.id}`;
        const description = article.summary ?? article.title;
        items.push(`    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${new Date(article.updatedAt).toUTCString()}</pubDate>
    </item>`);
      }
    }
  } catch {
    // API down: feed rỗng (không 500).
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MStudio Channel — Mới nhất</title>
    <link>${escapeXml(origin)}/</link>
    <description>Tin tức evidence-first, biên tập có kiểm chứng.</description>
    <language>vi</language>
    <atom:link href="${escapeXml(origin)}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
