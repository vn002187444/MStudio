import { parseRss } from "../workers/normalize/src/parsers.ts";
import crypto from "crypto";
import fs from "fs";

interface TargetFeed {
  feedId: string;
  sourceId: string;
  sourceName: string;
  country: string;
  url: string;
}

const FEEDS: TargetFeed[] = [
  { feedId: "feed-scmp-world", sourceId: "src-scmp", sourceName: "South China Morning Post", country: "China", url: "https://www.scmp.com/rss/91/feed" },
  { feedId: "feed-scmp-tech", sourceId: "src-scmp", sourceName: "SCMP Technology", country: "China", url: "https://www.scmp.com/rss/36/feed" },
  { feedId: "feed-yonhap-news", sourceId: "src-yonhap", sourceName: "Yonhap News Agency", country: "Korea", url: "https://en.yna.co.kr/RSS/news.xml" },
  { feedId: "feed-koreaherald-biz", sourceId: "src-koreaherald", sourceName: "The Korea Herald", country: "Korea", url: "https://www.koreaherald.com/common_prog/rss.php?ct=020000000000" },
  { feedId: "feed-japantimes", sourceId: "src-japantimes", sourceName: "The Japan Times", country: "Japan", url: "https://www.japantimes.co.jp/feed/" },
  { feedId: "feed-mainichi", sourceId: "src-mainichi", sourceName: "Mainichi News", country: "Japan", url: "https://mainichi.jp/english/rss/etc/mainichi-all.rss" },
  { feedId: "feed-bangkokpost", sourceId: "src-bangkokpost", sourceName: "Bangkok Post", country: "Thailand", url: "https://www.bangkokpost.com/rss/data/topstories.xml" },
  { feedId: "feed-nationthailand", sourceId: "src-nationthailand", sourceName: "The Nation Thailand", country: "Thailand", url: "https://www.nationthailand.com/rss/latest.xml" },
  { feedId: "feed-abc-au", sourceId: "src-abc-au", sourceName: "ABC News Australia", country: "Australia", url: "https://www.abc.net.au/news/feed/51120/rss.xml" },
  { feedId: "feed-smh", sourceId: "src-smh", sourceName: "Sydney Morning Herald", country: "Australia", url: "https://www.smh.com.au/rss/feed.xml" },
  { feedId: "feed-cna", sourceId: "src-cna", sourceName: "Channel NewsAsia", country: "Singapore", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml" }
];

async function main() {
  console.log("=== PULLING HOT STORIES FROM ASIA-PACIFIC FEEDS ===");
  const sqlStatements: string[] = [];
  let totalItems = 0;

  for (const f of FEEDS) {
    try {
      console.log(`Fetching [${f.country}] ${f.sourceName}...`);
      const res = await fetch(f.url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        console.log(`Failed HTTP ${res.status}: ${f.url}`);
        continue;
      }
      const text = await res.text();
      const items = parseRss(text).slice(0, 5); // Lấy 5 tin nóng nhất mỗi nguồn
      console.log(`  -> Found ${items.length} items`);

      for (const it of items) {
        const id = "raw-" + crypto.randomUUID();
        const payloadHash = crypto.createHash("sha256").update(it.url + (it.title || "")).digest("hex");
        const cleanTitle = (it.title || "").replace(/'/g, "''").slice(0, 300);
        const cleanUrl = it.url.replace(/'/g, "''");
        const publishedAt = it.publishedAt ? new Date(it.publishedAt).toISOString() : new Date().toISOString();
        const now = new Date().toISOString();

        sqlStatements.push(`INSERT OR IGNORE INTO raw_items (id, feed_id, source_id, external_id, url, canonical_url, title, published_at, fetched_at, payload_hash, status, created_at) VALUES ('${id}', '${f.feedId}', '${f.sourceId}', '${it.externalId || cleanUrl}', '${cleanUrl}', '${cleanUrl}', '${cleanTitle}', '${publishedAt}', '${now}', '${payloadHash}', 'incoming', '${now}');`);
        totalItems++;
      }
    } catch (err) {
      console.log(`Error fetching ${f.url}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`Generated ${sqlStatements.length} raw_items inserts.`);
  fs.writeFileSync("scripts/insert-apac-items.sql", sqlStatements.join("\n"), "utf8");
  console.log("Wrote scripts/insert-apac-items.sql successfully.");
}

main().catch(console.error);
