-- MStudio Channel articles and revisions (MST-041)
-- Owner: commandcode. Human gate: publishing.
-- PLAN: revision history, review gate, publish idempotency, correction
-- states (published -> updated/corrected/retracted).
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'drafted'
    CHECK (status IN (
      'drafted', 'ai_qa', 'human_review', 'auto_eligible', 'hold',
      'scheduled', 'published', 'updated', 'corrected', 'retracted'
    )),
  current_revision_id TEXT,
  published_revision_id TEXT,
  -- Idempotency guard: set to article_id||':'||revision_id when a
  -- publish lands. UNIQUE prevents a duplicate publish side-effect.
  publish_key TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE article_revisions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  summary TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (article_id, revision_number)
);

CREATE INDEX idx_articles_story_status ON articles (story_id, status);
CREATE INDEX idx_article_revisions_article ON article_revisions (article_id, revision_number);
