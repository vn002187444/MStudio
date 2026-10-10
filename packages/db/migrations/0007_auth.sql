-- Auth/RBAC (FU-10 / MST-070)
-- Owner: commandcode. Session token in D1 (opaque 256-bit, SHA-256 hashed
-- before storage), audit log for sensitive changes, per-IP write rate limit.

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('admin', 'editor', 'reviewer', 'seo', 'analyst')),
  expires_at TEXT NOT NULL
);

CREATE TABLE audit_log (
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  at TEXT NOT NULL
);

CREATE TABLE rate_limits (
  ip TEXT NOT NULL,
  window TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, window)
);
