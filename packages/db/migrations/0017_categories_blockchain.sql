-- 0017_categories_blockchain.sql
-- Add Blockchain & Web3 category to support dedicated international crypto/web3 feeds
INSERT OR IGNORE INTO categories (slug, label_vi, sort, status) VALUES
  ('blockchain', 'Blockchain & Web3', 18, 'active');
