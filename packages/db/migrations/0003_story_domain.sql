-- MStudio Channel story domain (MST-020)
-- Owner: commandcode. Human gate: schema_and_evidence_semantics.
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'researching', 'ready', 'published', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE story_sources (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  raw_item_id TEXT NOT NULL REFERENCES raw_items(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'supporting'
    CHECK (role IN ('primary', 'supporting', 'contradicting')),
  created_at TEXT NOT NULL,
  UNIQUE (story_id, raw_item_id, role)
);

CREATE TABLE facts (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source_refs TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0
    CHECK (confidence >= 0 AND confidence <= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'refuted')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL
    CHECK (kind IN ('person', 'organization', 'location', 'event', 'concept', 'other')),
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (normalized_name, kind)
);

CREATE TABLE story_entities (
  story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'subject'
    CHECK (role IN ('subject', 'mention', 'location', 'actor')),
  PRIMARY KEY (story_id, entity_id, role)
);

CREATE INDEX idx_story_sources_story ON story_sources (story_id);
CREATE INDEX idx_facts_story ON facts (story_id);
CREATE INDEX idx_claims_story_status ON claims (story_id, status);
CREATE INDEX idx_entities_normalized ON entities (normalized_name);
CREATE INDEX idx_story_entities_entity ON story_entities (entity_id);
