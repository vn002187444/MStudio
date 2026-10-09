-- MStudio Channel reader event pipeline (MST-060)
-- Owner: commandcode. ReaderEvent + ReaderProfile core model (PLAN.md core model).
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE TABLE reader_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  article_id TEXT,
  topic_id TEXT,
  url TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE reader_profiles (
  user_id TEXT PRIMARY KEY,
  followed_topic_ids TEXT NOT NULL DEFAULT '[]',
  hidden_topic_ids TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_reader_events_article ON reader_events (article_id, occurred_at);
CREATE INDEX idx_reader_events_user ON reader_events (user_id, occurred_at);
