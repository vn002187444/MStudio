-- Migration number: 0015 	 2024-10-15T15:00:00.000Z
-- Bảng emails
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  sender_name TEXT,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  preview TEXT,
  category TEXT DEFAULT 'Phản hồi',
  status TEXT DEFAULT 'unread',
  starred INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Bảng redirects
CREATE TABLE IF NOT EXISTS redirects (
  id TEXT PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Bảng system_settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
