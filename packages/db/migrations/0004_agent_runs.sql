-- MStudio Channel agent runs (MST-031)
-- Owner: commandcode. Human gate: editorial_ai.
-- PLAN core model: AgentRun luu story/job ID, type, prompt version,
-- model/version, evidence/source refs, structured input/output,
-- status/error, timestamps va reviewer disposition.
-- Production path: wrangler d1 migrations apply (applied exactly once, tracked by D1).

CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  story_id TEXT,
  job_id TEXT,
  type TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,
  model_version TEXT,
  evidence_refs TEXT NOT NULL DEFAULT '[]',
  input TEXT NOT NULL,
  output TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  error_code TEXT,
  error_message TEXT,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 1,
  reviewer_disposition TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  CHECK (story_id IS NOT NULL OR job_id IS NOT NULL)
);

CREATE INDEX idx_agent_runs_status ON agent_runs (status, created_at);
CREATE INDEX idx_agent_runs_story ON agent_runs (story_id, created_at);
