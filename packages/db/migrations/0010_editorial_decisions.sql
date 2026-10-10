CREATE TABLE editorial_decisions (
  id TEXT PRIMARY KEY,
  raw_item_id TEXT NOT NULL UNIQUE,
  decision TEXT NOT NULL CHECK (decision IN ('accepted', 'rejected')),
  story_id TEXT,
  article_id TEXT,
  revision_id TEXT,
  draft_source TEXT CHECK (draft_source IN ('raw', 'ai')),
  actor TEXT NOT NULL,
  decided_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (raw_item_id) REFERENCES raw_items(id) ON DELETE CASCADE,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (revision_id) REFERENCES article_revisions(id) ON DELETE CASCADE
);
