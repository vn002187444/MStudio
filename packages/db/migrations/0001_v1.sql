-- MStudio Channel D1 schema v1 (MST-004)
-- Owner: commandcode. Human gate: schema.
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  origin_url TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('rss', 'sitemap', 'api', 'manual')),
  rights_status TEXT NOT NULL DEFAULT 'unknown' CHECK (rights_status IN ('clear', 'licensed', 'unknown')),
  allow_status TEXT NOT NULL DEFAULT 'pending' CHECK (allow_status IN ('approved', 'denied', 'pending')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE feeds (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('rss', 'atom', 'jsonfeed', 'sitemap')),
  enabled INTEGER NOT NULL DEFAULT 1,
  fetch_interval_seconds INTEGER NOT NULL DEFAULT 900,
  last_fetched_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (source_id, url)
);

CREATE TABLE raw_items (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id TEXT,
  url TEXT NOT NULL,
  canonical_url TEXT,
  title TEXT,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'incoming' CHECK (status IN ('incoming', 'normalized', 'clustered', 'discarded')),
  created_at TEXT NOT NULL,
  UNIQUE (feed_id, external_id)
);

CREATE INDEX idx_raw_items_feed_fetched ON raw_items (feed_id, fetched_at);
CREATE INDEX idx_raw_items_status_created ON raw_items (status, created_at);
CREATE INDEX idx_raw_items_canonical ON raw_items (canonical_url) WHERE canonical_url IS NOT NULL;
CREATE INDEX idx_raw_items_payload_hash ON raw_items (payload_hash);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  payload TEXT NOT NULL DEFAULT '{}',
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  correlation_id TEXT,
  error_code TEXT,
  error_message TEXT,
  scheduled_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_jobs_status_type ON jobs (status, type);
CREATE INDEX idx_jobs_correlation_id ON jobs (correlation_id);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'editor', 'reviewer', 'seo', 'analyst')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
