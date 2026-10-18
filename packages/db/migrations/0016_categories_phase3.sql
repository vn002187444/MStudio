-- Categories phase 3 — align the repo migration set with the slugs the
-- reader app already routes and the categories already present in prod
-- (thoi-su, kinh-te, khoa-hoc, the-thao). INSERT OR IGNORE keeps this a
-- no-op on databases that already have them.
INSERT OR IGNORE INTO categories (slug, label_vi, sort, status) VALUES
  ('thoi-su', 'Thời sự', 14, 'active'),
  ('kinh-te', 'Kinh tế', 15, 'active'),
  ('khoa-hoc', 'Khoa học', 16, 'active'),
  ('the-thao', 'Thể thao', 17, 'active');
