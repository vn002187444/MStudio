-- seed-international-sources.sql
-- Tối ưu hóa nguồn RSS: Bổ sung nguồn quốc tế uy tín & hạn chế trùng lặp nguồn tin nội địa
-- Owner: commandcode. Cloudflare Free-Tier compliant.

-- 1. Bổ sung các hãng thông tấn & tạp chí quốc tế hàng đầu
INSERT OR IGNORE INTO sources (id, name, origin_url, kind, rights_status, allow_status, created_at, updated_at) VALUES
  ('src-wired', 'Wired', 'https://www.wired.com', 'rss', 'unknown', 'approved', '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('src-mittech', 'MIT Technology Review', 'https://www.technologyreview.com', 'rss', 'unknown', 'approved', '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('src-arstechnica', 'Ars Technica', 'https://arstechnica.com', 'rss', 'unknown', 'approved', '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('src-theguardian', 'The Guardian', 'https://www.theguardian.com', 'rss', 'unknown', 'approved', '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('src-apnews', 'AP News', 'https://apnews.com', 'rss', 'unknown', 'approved', '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z');

-- 2. Đăng ký các feeds quốc tế chất lượng cao
INSERT OR IGNORE INTO feeds (id, source_id, url, format, enabled, fetch_interval_seconds, created_at, updated_at) VALUES
  ('feed-wired-top', 'src-wired', 'https://www.wired.com/feed/rss', 'rss', 1, 900, '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('feed-mittech-ai', 'src-mittech', 'https://www.technologyreview.com/feed/', 'rss', 1, 900, '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('feed-arstechnica-tech', 'src-arstechnica', 'https://feeds.arstechnica.com/arstechnica/index', 'rss', 1, 900, '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('feed-theguardian-world', 'src-theguardian', 'https://www.theguardian.com/world/rss', 'rss', 1, 900, '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z'),
  ('feed-apnews-world', 'src-apnews', 'https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en', 'rss', 1, 900, '2026-10-16T03:30:00.000Z', '2026-10-16T03:30:00.000Z');

-- 3. Hạn chế các feed báo trong nước bị trùng lặp chủ đề giải trí / thể thao / đời sống
UPDATE feeds
SET enabled = 0, updated_at = '2026-10-16T03:30:00.000Z'
WHERE id IN (
  'feed-tt-thegioi',
  'feed-tt-thethao',
  'feed-tt-giaitri',
  'feed-cafef-ck',
  'feed-tn-thethao',
  'feed-tn-gioitre'
);
