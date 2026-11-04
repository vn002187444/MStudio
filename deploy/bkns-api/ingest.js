/**
 * MStudio Autonomous Ingest Pipeline (Node 24 + Native SQLite SSD)
 * Fetches RSS/Atom feeds, parses articles, deduplicates, and stores directly in mstudio.db.
 * Can be run via CLI (cPanel Cron) or called via HTTP Admin API.
 */
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data", "mstudio.db");

// Category mapping helper
function resolveCategory(feedId, feedUrl, title) {
  const text = `${feedId} ${feedUrl} ${title}`.toLowerCase();
  if (text.includes("cong-nghe") || text.includes("tech") || text.includes("tinhte") || text.includes("genk") || text.includes("machinelearning") || text.includes("technology") || text.includes("ai")) {
    return "cong-nghe";
  }
  if (text.includes("kinh-te") || text.includes("kinh-doanh") || text.includes("tai-chinh") || text.includes("cafef") || text.includes("finance")) {
    return "kinh-te";
  }
  if (text.includes("the-thao") || text.includes("bong-da") || text.includes("sport")) {
    return "the-thao";
  }
  if (text.includes("giai-tri") || text.includes("sao") || text.includes("showbiz") || text.includes("dien-anh")) {
    return "giai-tri";
  }
  if (text.includes("kham-pha") || text.includes("khoa-hoc") || text.includes("tri-thuc") || text.includes("science")) {
    return "kham-pha";
  }
  if (text.includes("the-gioi") || text.includes("quoc-te") || text.includes("world")) {
    return "the-gioi";
  }
  if (text.includes("suc-khoe") || text.includes("doi-song") || text.includes("du-lich") || text.includes("xe") || text.includes("oto")) {
    return "doi-song";
  }
  return "thoi-su";
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function decodeEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(str) {
  if (!str) return "";
  return decodeEntities(str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const normalRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const normalMatch = normalRegex.exec(xml);
  return normalMatch ? normalMatch[1].trim() : null;
}

function extractImageUrl(block, content) {
  const encMatch = /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["']/i.exec(block) ||
                   /<enclosure\b[^>]*url=["']([^"']+)["']/i.exec(block);
  if (encMatch && encMatch[1].startsWith("http")) return encMatch[1];

  const mediaMatch = /<media:content\b[^>]*url=["']([^"']+)["']/i.exec(block);
  if (mediaMatch && mediaMatch[1].startsWith("http")) return mediaMatch[1];

  const imgMatch = /<img\b[^>]*src=["']([^"']+)["']/i.exec(content || "") ||
                   /<img\b[^>]*src=["']([^"']+)["']/i.exec(block);
  if (imgMatch && imgMatch[1].startsWith("http")) return imgMatch[1];

  return null;
}

function parseFeedXml(xml) {
  const items = [];
  const trimmed = xml.trimStart();
  const isAtom = /<entry[\s>]|<feed[\s>]/i.test(trimmed);

  if (isAtom) {
    const entryPattern = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    let match;
    while ((match = entryPattern.exec(xml)) !== null) {
      const block = match[1];
      const title = decodeEntities(extractTag(block, "title") || "");
      const linkMatch = /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i.exec(block) ||
                        /<link\b[^>]*href=["']([^"']+)["']/i.exec(block);
      const link = linkMatch ? linkMatch[1] : extractTag(block, "id");
      const published = extractTag(block, "published") || extractTag(block, "updated");
      const content = extractTag(block, "content") || extractTag(block, "summary") || "";
      const cleanContent = stripHtml(content);
      const imageUrl = extractImageUrl(block, content);

      if (link && title) {
        items.push({
          url: decodeEntities(link).trim(),
          externalId: extractTag(block, "id") || link,
          title: title.trim(),
          publishedAt: published || new Date().toISOString(),
          summary: cleanContent.slice(0, 300),
          body: cleanContent,
          imageUrl: imageUrl,
        });
      }
    }
  } else {
    // RSS
    const itemPattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemPattern.exec(xml)) !== null) {
      const block = match[1];
      const title = decodeEntities(extractTag(block, "title") || "");
      const link = extractTag(block, "link") || extractTag(block, "guid");
      const guid = extractTag(block, "guid") || link;
      const pubDate = extractTag(block, "pubDate");
      const encoded = extractTag(block, "content:encoded");
      const desc = extractTag(block, "description") || "";
      const rawContent = encoded || desc;
      const cleanContent = stripHtml(rawContent);
      const imageUrl = extractImageUrl(block, rawContent);

      if (link && title) {
        items.push({
          url: decodeEntities(link).trim(),
          externalId: guid,
          title: title.trim(),
          publishedAt: pubDate || new Date().toISOString(),
          summary: cleanContent.slice(0, 300),
          body: cleanContent,
          imageUrl: imageUrl,
        });
      }
    }
  }
  return items;
}

export async function runIngest(options = {}) {
  const maxFeeds = options.maxFeeds || 20;
  const timeoutMs = options.timeoutMs || 6000;
  const startTime = Date.now();

  const db = new DatabaseSync(dbPath);
  console.log(`[Ingest] Starting RSS Ingest Pipeline at ${new Date().toISOString()}`);

  const feeds = db.prepare(`
    SELECT f.id, f.url, s.name as source_name
    FROM feeds f
    JOIN sources s ON s.id = f.source_id
    WHERE f.enabled = 1 AND s.allow_status = 'approved'
    ORDER BY COALESCE(f.last_fetched_at, '') ASC
    LIMIT ?
  `).all(maxFeeds);

  console.log(`[Ingest] Selected ${feeds.length} feeds to scan.`);

  let totalFetched = 0;
  let totalNewArticles = 0;
  let totalDuplicates = 0;
  let failedFeeds = 0;

  const checkArticleStmt = db.prepare("SELECT id FROM articles WHERE canonical_url = ? OR slug = ? LIMIT 1");
  const insertStoryStmt = db.prepare(`
    INSERT INTO stories (id, title, summary, status, created_at, updated_at)
    VALUES (?, ?, ?, 'published', ?, ?)
  `);
  const insertArticleStmt = db.prepare(`
    INSERT INTO articles (
      id, story_id, status, current_revision_id, published_revision_id, publish_key,
      created_at, updated_at, slug, category_slug, hero_image_url,
      meta_title, meta_description, canonical_url, og_image_url,
      source_count, quality_score, is_breaking, is_trending
    ) VALUES (
      ?, ?, 'published', ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      1, 90, 0, 0
    )
  `);
  const insertRevisionStmt = db.prepare(`
    INSERT INTO article_revisions (
      id, article_id, revision_number, title, body, summary, created_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?)
  `);
  const updateFeedStmt = db.prepare(`
    UPDATE feeds SET last_fetched_at = ?, last_error = ? WHERE id = ?
  `);

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const xml = await res.text();
      const items = parseFeedXml(xml);
      totalFetched += items.length;

      let feedNew = 0;
      const nowIso = new Date().toISOString();

      for (const item of items) {
        const slug = slugify(item.title);
        if (!slug || slug.length < 5) continue;

        const existing = checkArticleStmt.get(item.url, slug);
        if (existing) {
          totalDuplicates++;
          continue;
        }

        const categorySlug = resolveCategory(feed.id, feed.url, item.title);
        const storyId = crypto.randomUUID();
        const articleId = crypto.randomUUID();
        const revisionId = crypto.randomUUID();
        const publishKey = `${articleId}:${revisionId}`;
        const canonicalUrl = `https://mstudio.minds.io.vn/bai-viet/${slug}`;
        const heroImage = item.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";
        const bodyContent = `${item.title}\n\n${item.summary}\n\nNguồn: ${feed.source_name} (${item.url})`;

        insertStoryStmt.run(storyId, item.title, item.summary, nowIso, nowIso);
        insertArticleStmt.run(
          articleId, storyId, revisionId, revisionId, publishKey,
          nowIso, nowIso, slug, categorySlug, heroImage,
          item.title, item.summary, canonicalUrl, heroImage
        );
        insertRevisionStmt.run(revisionId, articleId, item.title, bodyContent, item.summary, nowIso);

        totalNewArticles++;
        feedNew++;
      }

      updateFeedStmt.run(nowIso, null, feed.id);
      if (feedNew > 0) {
        console.log(`  [+] Feed "${feed.id}" (${feed.source_name}): +${feedNew} new articles (parsed ${items.length})`);
      }
    } catch (err) {
      failedFeeds++;
      const nowIso = new Date().toISOString();
      updateFeedStmt.run(nowIso, String(err.message || err), feed.id);
      console.warn(`  [-] Feed "${feed.id}" error: ${err.message}`);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const summary = {
    feedsScanned: feeds.length,
    failedFeeds,
    totalItemsParsed: totalFetched,
    newArticlesAdded: totalNewArticles,
    duplicatesSkipped: totalDuplicates,
    durationSeconds: Number(durationSec),
    timestamp: new Date().toISOString()
  };

  console.log(`[Ingest] Finished in ${durationSec}s. New: ${totalNewArticles}, Duplicates: ${totalDuplicates}, Failed feeds: ${failedFeeds}`);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const maxFeeds = process.argv[2] ? parseInt(process.argv[2], 10) : 20;
  runIngest({ maxFeeds })
    .then((res) => {
      console.log("[Ingest Summary]:", JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Ingest Fatal Error]:", err);
      process.exit(1);
    });
}
