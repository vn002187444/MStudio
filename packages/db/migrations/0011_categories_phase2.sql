-- Categories phase 2 (FU-18 / MST-071, Human-approved 10-10-2026).
-- Owner: commandcode (data migration, không đổi DDL). 4 verticals mới
-- theo quyết định rút gọn (bỏ Thể thao, Du lịch). Sort tiếp tục 10-13
-- sau phase 1 (0009).
INSERT INTO categories (slug, label_vi, sort, status) VALUES
  ('kinh-doanh', 'Kinh doanh', 10, 'active'),
  ('suc-khoe', 'Sức khỏe', 11, 'active'),
  ('giao-duc', 'Giáo dục', 12, 'active'),
  ('xe', 'Xe', 13, 'active');
