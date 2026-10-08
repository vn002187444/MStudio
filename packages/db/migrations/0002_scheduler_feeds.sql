-- MStudio Channel D1 schema v1 (MST-006)
-- Owner: commandcode. Human gate: schema (via MST-004).
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE INDEX idx_feeds_enabled_created ON feeds (enabled, created_at, id);
