-- Articles read path performance indexes
-- Owner: commandcode. Human gate: schema.

CREATE INDEX IF NOT EXISTS idx_articles_status_updated_id ON articles (status, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_status_updated_id ON articles (category_slug, status, updated_at DESC, id DESC);
