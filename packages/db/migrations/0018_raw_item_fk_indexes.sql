-- Raw-item FK cascade & orphan cleanup performance indexes
-- Owner: commandcode / lead. Human approved: 2026-11-25.

CREATE INDEX IF NOT EXISTS idx_story_sources_raw_item ON story_sources (raw_item_id);
CREATE INDEX IF NOT EXISTS idx_editorial_decisions_raw_item ON editorial_decisions (raw_item_id);
