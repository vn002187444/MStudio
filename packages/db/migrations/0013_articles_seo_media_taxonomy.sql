-- 0013_articles_seo_media_taxonomy.sql
-- Articles SEO, Media, Taxonomy, and Quality Metadata (MST-081 / FU-30)
-- Owner: commandcode. Human gate: schema (approved).

ALTER TABLE articles ADD COLUMN slug TEXT;
ALTER TABLE articles ADD COLUMN category_slug TEXT REFERENCES categories(slug);
ALTER TABLE articles ADD COLUMN hero_image_url TEXT;
ALTER TABLE articles ADD COLUMN video_url TEXT;
ALTER TABLE articles ADD COLUMN meta_title TEXT;
ALTER TABLE articles ADD COLUMN meta_description TEXT;
ALTER TABLE articles ADD COLUMN canonical_url TEXT;
ALTER TABLE articles ADD COLUMN og_image_url TEXT;
ALTER TABLE articles ADD COLUMN keywords TEXT;
ALTER TABLE articles ADD COLUMN source_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN quality_score REAL;
ALTER TABLE articles ADD COLUMN is_breaking INTEGER NOT NULL DEFAULT 0;
ALTER TABLE articles ADD COLUMN is_trending INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_status ON articles (category_slug, status);
CREATE INDEX IF NOT EXISTS idx_articles_breaking ON articles (is_breaking, status);
CREATE INDEX IF NOT EXISTS idx_articles_trending ON articles (is_trending, status);
