-- Media fallback tier B (FU-15 / MST-073)
-- Owner: commandcode. raw_items.image_url persists the
-- parser-extracted hero image; media_assets tracks R2
-- rehosts (only when rights_status is clear/licensed).

ALTER TABLE raw_items ADD COLUMN image_url TEXT;

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
  origin_url TEXT NOT NULL,
  r2_key TEXT,
  source TEXT,
  creator TEXT,
  rights_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (rights_status IN ('clear', 'licensed', 'unknown')),
  license TEXT,
  credit TEXT,
  caption TEXT,
  alt TEXT,
  width INTEGER,
  height INTEGER,
  asset_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_media_article ON media_assets (article_id);
