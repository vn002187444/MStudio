-- seed-sources-and-taxonomy.sql
-- MST-092 & MST-098: Taxonomy expansion, International & Domestic RSS sources
-- Owner: commandcode. Cloudflare Free-Tier compliant.

-- 1. Expand category taxonomy for complete subcategory coverage
INSERT OR IGNORE INTO categories (slug, label_vi, sort, status) VALUES
  ('thoi-su', 'Thời sự', 14, 'active'),
  ('kinh-te', 'Kinh tế', 15, 'active'),
  ('khoa-hoc', 'Khoa học', 16, 'active'),
  ('the-thao', 'Thể thao', 17, 'active');

-- Ensure quota_usage table exists for tracking
CREATE TABLE IF NOT EXISTS quota_usage (
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  cost_sum INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (kind, day)
);

CREATE INDEX IF NOT EXISTS idx_quota_usage_day ON quota_usage (day);

-- 2. International & Vietnamese Media Sources (MST-092)
INSERT OR IGNORE INTO sources (id, name, origin_url, kind, rights_status, allow_status, created_at, updated_at) VALUES
  ('src-vnexpress', 'VNExpress', 'https://vnexpress.net', 'rss', 'unknown', 'approved', '2026-10-10T08:45:00.000Z', '2026-10-10T08:45:00.000Z'),
  ('src-tuoitre', 'Tuoi Tre', 'https://tuoitre.vn', 'rss', 'unknown', 'approved', '2026-10-10T08:45:00.000Z', '2026-10-10T08:45:00.000Z'),
  ('src-thanhnien', 'Thanh Nien', 'https://thanhnien.vn', 'rss', 'unknown', 'approved', '2026-10-10T08:45:00.000Z', '2026-10-10T08:45:00.000Z'),
  ('src-techcrunch', 'TechCrunch', 'https://techcrunch.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-theverge', 'The Verge', 'https://www.theverge.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-hackernews', 'Hacker News', 'https://news.ycombinator.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-bloomberg', 'Bloomberg Markets', 'https://bloomberg.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-cnbc', 'CNBC Business', 'https://www.cnbc.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-cafef', 'CafeF', 'https://cafef.vn', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-vneconomy', 'VnEconomy', 'https://vneconomy.vn', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-reuters', 'Reuters', 'https://reuters.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-bbc', 'BBC News', 'https://bbc.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-sciencedaily', 'Science Daily', 'https://www.sciencedaily.com', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('src-bbcsport', 'BBC Sport', 'https://www.bbc.com/sport', 'rss', 'unknown', 'approved', '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z');

-- 3. Feeds for all categories with 2-3+ sources per vertical
INSERT OR IGNORE INTO feeds (id, source_id, url, format, enabled, fetch_interval_seconds, created_at, updated_at) VALUES
  -- cong-nghe (TechCrunch, The Verge, Hacker News, VnExpress Số Hóa)
  ('feed-tc-main', 'src-techcrunch', 'https://techcrunch.com/feed/', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-verge-main', 'src-theverge', 'https://www.theverge.com/rss/index.xml', 'atom', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-hn-main', 'src-hackernews', 'https://news.ycombinator.com/rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-sohoa', 'src-vnexpress', 'https://vnexpress.net/rss/so-hoa.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- kinh-te (Bloomberg Markets, CNBC Business, CafeF, VnEconomy)
  ('feed-bloomberg-markets', 'src-bloomberg', 'https://news.google.com/rss/search?q=site:bloomberg.com+markets&hl=en-US&gl=US&ceid=US:en', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-cnbc-business', 'src-cnbc', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-cafef-ck', 'src-cafef', 'https://cafef.vn/thi-truong-chung-khoan.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-cafef-tc', 'src-cafef', 'https://cafef.vn/tai-chinh-ngan-hang.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vneconomy-tc', 'src-vneconomy', 'https://vneconomy.vn/tai-chinh.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- the-gioi (Reuters, BBC World News, Tuổi Trẻ Thế Giới, VnExpress Thế Giới)
  ('feed-reuters-world', 'src-reuters', 'https://news.google.com/rss/search?q=site:reuters.com+world&hl=en-US&gl=US&ceid=US:en', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-bbc-world', 'src-bbc', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tt-thegioi', 'src-tuoitre', 'https://tuoitre.vn/rss/the-gioi.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-thegioi', 'src-vnexpress', 'https://vnexpress.net/rss/the-gioi.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- khoa-hoc (Science Daily, VnExpress Khoa Học, Tuổi Trẻ Khoa Học)
  ('feed-sciencedaily-all', 'src-sciencedaily', 'https://www.sciencedaily.com/rss/all.xml', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-khoahoc', 'src-vnexpress', 'https://vnexpress.net/rss/khoa-hoc.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tt-khoahoc', 'src-tuoitre', 'https://tuoitre.vn/rss/khoa-hoc.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- the-thao (BBC Sport, Tuổi Trẻ Thể Thao, Thanh Niên Thể Thao, VnExpress Thể Thao)
  ('feed-bbc-sport', 'src-bbcsport', 'http://feeds.bbci.co.uk/sport/rss.xml', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tt-thethao', 'src-tuoitre', 'https://tuoitre.vn/rss/the-thao.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tn-thethao', 'src-thanhnien', 'https://thanhnien.vn/rss/the-thao.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-thethao', 'src-vnexpress', 'https://vnexpress.net/rss/the-thao.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- giai-tri (Thanh Niên Giải Trí, Tuổi Trẻ Giải Trí, VnExpress Giải Trí)
  ('feed-tn-giaitri', 'src-thanhnien', 'https://thanhnien.vn/rss/giai-tri.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tt-giaitri', 'src-tuoitre', 'https://tuoitre.vn/rss/giai-tri.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-giaitri', 'src-vnexpress', 'https://vnexpress.net/rss/giai-tri.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- doi-song (Tuổi Trẻ Đời Sống, Thanh Niên Giới Trẻ, VnExpress Đời Sống)
  ('feed-tt-doisong', 'src-tuoitre', 'https://tuoitre.vn/rss/doi-song.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tn-gioitre', 'src-thanhnien', 'https://thanhnien.vn/rss/gioi-tre.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-vne-doisong', 'src-vnexpress', 'https://vnexpress.net/rss/doi-song.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- thoi-su (VnExpress Thời Sự, Tuổi Trẻ Thời Sự, Thanh Niên Thời Sự)
  ('feed-vne-thoisu', 'src-vnexpress', 'https://vnexpress.net/rss/thoi-su.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tt-thoisu', 'src-tuoitre', 'https://tuoitre.vn/rss/thoi-su.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),
  ('feed-tn-thoisu', 'src-thanhnien', 'https://thanhnien.vn/rss/thoi-su.rss', 'rss', 1, 900, '2026-10-13T06:00:00.000Z', '2026-10-13T06:00:00.000Z'),

  -- goc-toi (Kỳ án, Hồ sơ vụ án, Phá án, Điều tra, Dark History)
  ('feed-vne-phapluat', 'src-vnexpress', 'https://vnexpress.net/rss/phap-luat.rss', 'rss', 1, 900, '2026-10-18T05:00:00.000Z', '2026-10-18T05:00:00.000Z'),
  ('feed-tt-phapluat', 'src-tuoitre', 'https://tuoitre.vn/rss/phap-luat.rss', 'rss', 1, 900, '2026-10-18T05:00:00.000Z', '2026-10-18T05:00:00.000Z'),
  ('feed-tn-phapluat', 'src-thanhnien', 'https://thanhnien.vn/rss/thoi-su/phap-luat.rss', 'rss', 1, 900, '2026-10-18T05:00:00.000Z', '2026-10-18T05:00:00.000Z');
