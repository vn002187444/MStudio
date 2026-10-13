-- Seed Nguồn RSS Châu Á - Thái Bình Dương (China, Korea, Japan, Thailand, Australia, Singapore)
-- MST-092 Expansion Phase 2: Nguồn tin nóng khu vực

-- 1. Nguồn (sources)
INSERT OR IGNORE INTO sources (id, name, origin_url, kind, rights_status, allow_status, created_at, updated_at) VALUES
  -- China
  ('src-scmp', 'South China Morning Post', 'https://www.scmp.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-sixthtone', 'Sixth Tone', 'https://www.sixthtone.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  -- Korea
  ('src-yonhap', 'Yonhap News Agency', 'https://en.yna.co.kr', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-koreaherald', 'The Korea Herald', 'https://www.koreaherald.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-koreatimes', 'The Korea Times', 'https://www.koreatimes.co.kr', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  -- Japan
  ('src-japantimes', 'The Japan Times', 'https://www.japantimes.co.jp', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-mainichi', 'Mainichi News', 'https://mainichi.jp', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-nippon', 'Nippon.com', 'https://www.nippon.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  -- Thailand
  ('src-bangkokpost', 'Bangkok Post', 'https://www.bangkokpost.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-nationthailand', 'The Nation Thailand', 'https://www.nationthailand.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-thaiger', 'The Thaiger', 'https://thethaiger.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  -- Australia
  ('src-abc-au', 'ABC News Australia', 'https://www.abc.net.au', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-smh', 'Sydney Morning Herald', 'https://www.smh.com.au', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-news-au', 'News.com.au', 'https://www.news.com.au', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  -- Singapore & ASEAN Hub
  ('src-straitstimes', 'The Straits Times', 'https://www.straitstimes.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now')),
  ('src-cna', 'Channel NewsAsia (CNA)', 'https://www.channelnewsasia.com', 'rss', 'unknown', 'approved', datetime('now'), datetime('now'));

-- 2. Luồng dữ liệu (feeds)
INSERT OR IGNORE INTO feeds (id, source_id, url, format, enabled, fetch_interval_seconds, created_at, updated_at) VALUES
  -- China Feeds
  ('feed-scmp-world', 'src-scmp', 'https://www.scmp.com/rss/91/feed', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-scmp-tech', 'src-scmp', 'https://www.scmp.com/rss/36/feed', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-scmp-biz', 'src-scmp', 'https://www.scmp.com/rss/92/feed', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-sixthtone', 'src-sixthtone', 'https://www.sixthtone.com/rss', 'rss', 1, 900, datetime('now'), datetime('now')),

  -- Korea Feeds
  ('feed-yonhap-news', 'src-yonhap', 'https://en.yna.co.kr/RSS/news.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-koreaherald-biz', 'src-koreaherald', 'https://www.koreaherald.com/common_prog/rss.php?ct=020000000000', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-koreatimes-all', 'src-koreatimes', 'https://www.koreatimes.co.kr/www/rss/rss.xml', 'rss', 1, 900, datetime('now'), datetime('now')),

  -- Japan Feeds
  ('feed-japantimes', 'src-japantimes', 'https://www.japantimes.co.jp/feed/', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-mainichi', 'src-mainichi', 'https://mainichi.jp/english/rss/etc/mainichi-all.rss', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-nippon', 'src-nippon', 'https://www.nippon.com/en/feed/', 'rss', 1, 900, datetime('now'), datetime('now')),

  -- Thailand Feeds
  ('feed-bangkokpost', 'src-bangkokpost', 'https://www.bangkokpost.com/rss/data/topstories.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-nationthailand', 'src-nationthailand', 'https://www.nationthailand.com/rss/latest.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-thaiger', 'src-thaiger', 'https://thethaiger.com/feed', 'rss', 1, 900, datetime('now'), datetime('now')),

  -- Australia Feeds
  ('feed-abc-au', 'src-abc-au', 'https://www.abc.net.au/news/feed/51120/rss.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-smh', 'src-smh', 'https://www.smh.com.au/rss/feed.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-news-au', 'src-news-au', 'https://www.news.com.au/content-feeds/latest-news-world/', 'rss', 1, 900, datetime('now'), datetime('now')),

  -- Singapore & ASEAN Feeds
  ('feed-straitstimes', 'src-straitstimes', 'https://www.straitstimes.com/news/world/rss.xml', 'rss', 1, 900, datetime('now'), datetime('now')),
  ('feed-cna', 'src-cna', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', 'rss', 1, 900, datetime('now'), datetime('now'));
