-- Categories (MST-071 / FU-11 phase 1)
-- Owner: commandcode. DB-backed taxonomy replacing the
-- hardcoded FE nav (apps/web/components/Navigation/taxonomy.ts).

CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  label_vi TEXT NOT NULL,
  parent_slug TEXT REFERENCES categories (slug),
  sort INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'))
);

INSERT INTO categories (slug, label_vi, sort, status) VALUES
  ('moi-nhat', 'Mới nhất', 0, 'active'),
  ('danh-cho-ban', 'Dành cho bạn', 1, 'active'),
  ('dang-nong', 'Đang nóng', 2, 'active'),
  ('the-gioi', 'Thế giới', 3, 'active'),
  ('cong-nghe', 'Công nghệ', 4, 'active'),
  ('ai-channel', 'AI Channel', 5, 'active'),
  ('giai-tri', 'Giải trí', 6, 'active'),
  ('kham-pha', 'Khám phá', 7, 'active'),
  ('doi-song', 'Đời sống', 8, 'active'),
  ('goc-toi', 'Góc Tối', 9, 'active');
