-- seed-category-feeds.sql
-- Thêm các nguồn RSS uy tín cho các chuyên mục: Sức khỏe, Khám phá, Xe

INSERT OR IGNORE INTO sources (id, name, origin_url, kind, rights_status, allow_status, created_at, updated_at)
VALUES
  ('src-vnex-suckhoe', 'VNExpress Sức khỏe', 'https://vnexpress.net/suc-khoe', 'rss', 'clear', 'approved', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('src-dantri-khampha', 'Dân trí Khám phá', 'https://dantri.com.vn/kham-pha.htm', 'rss', 'clear', 'approved', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('src-vnex-xe', 'VNExpress Xe', 'https://vnexpress.net/oto-xe-may', 'rss', 'clear', 'approved', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

INSERT OR IGNORE INTO feeds (id, source_id, url, format, enabled, fetch_interval_seconds, created_at, updated_at)
VALUES
  ('feed-vnex-suckhoe', 'src-vnex-suckhoe', 'https://vnexpress.net/rss/suc-khoe.rss', 'rss', 1, 900, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('feed-dantri-khampha', 'src-dantri-khampha', 'https://dantri.com.vn/rss/kham-pha.rss', 'rss', 1, 900, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('feed-vnex-xe', 'src-vnex-xe', 'https://vnexpress.net/rss/oto-xe-may.rss', 'rss', 1, 900, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
