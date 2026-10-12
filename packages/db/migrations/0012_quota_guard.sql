-- 0012_quota_guard.sql — QuotaGuard usage counters (FU-25 free-tier budget
-- protection, owner: jules). Human gate: schema.
--
-- Chỉ tạo file — KHÔNG apply tự động. Human Lead review rồi chạy
-- `wrangler d1 migrations apply` (xem docs/fu-13-deploy-runbook).
-- Tests dùng openMigratedTestDb() nên file này được chạy trong bộ test.
--
-- quota_usage: usage counter theo ngày UTC (Cloudflare free tier reset
-- 00:00 UTC). Một dòng cho mỗi (kind, day); cost_sum là tổng cost units
-- (ai = số model call, d1 = số rows, r2 = số operations) trong ngày.
CREATE TABLE quota_usage (
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  cost_sum INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (kind, day)
);

-- Summary query theo ngày (/quota/summary đọc toàn bộ kinds trong 1 ngày).
CREATE INDEX idx_quota_usage_day ON quota_usage (day);
