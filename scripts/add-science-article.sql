-- add-science-article.sql
INSERT OR REPLACE INTO stories (id, title, summary, status, created_at, updated_at) VALUES (
  'story-y-hoc-luong-tu-2026',
  'Đột phá y học lượng tử: Ứng dụng cảm biến sinh học trong chẩn đoán sớm',
  'Các nhà khoa học phát triển thành công thế hệ cảm biến sinh học lượng tử có độ nhạy vượt trội, mở ra kỷ nguyên mới trong việc phát hiện mầm bệnh ở cấp độ phân tử.',
  'published', '2026-10-13T06:25:00.000Z', '2026-10-13T06:25:00.000Z'
);

INSERT OR REPLACE INTO facts (id, story_id, text, source_refs, confidence, created_at, updated_at) VALUES (
  'fact-y-hoc-luong-tu-1', 'story-y-hoc-luong-tu-2026',
  'Thiết bị cảm biến lượng tử mới có khả năng phát hiện dấu ấn sinh học của tế bào lạ sớm hơn từ 12 đến 18 tháng so với kỹ thuật xét nghiệm truyền thống.',
  '[{"sourceId":"src-sciencedaily"}]', 0.96, '2026-10-13T06:25:00.000Z', '2026-10-13T06:25:00.000Z'
);

INSERT OR REPLACE INTO claims (id, story_id, text, status, created_at, updated_at) VALUES (
  'claim-y-hoc-luong-tu-1', 'story-y-hoc-luong-tu-2026',
  'Sự kết hợp giữa công nghệ lượng tử và y học cá thể hóa sẽ tạo nên cuộc cách mạng trong điều trị ung thư và các bệnh lý phức tạp.',
  'confirmed', '2026-10-13T06:25:00.000Z', '2026-10-13T06:25:00.000Z'
);

INSERT OR REPLACE INTO articles (
  id, story_id, status, current_revision_id, published_revision_id, publish_key,
  slug, category_slug, hero_image_url, meta_title, meta_description, canonical_url,
  og_image_url, keywords, source_count, quality_score, is_breaking, is_trending,
  created_at, updated_at
) VALUES (
  'art-y-hoc-luong-tu-2026', 'story-y-hoc-luong-tu-2026', 'published', 'rev-y-hoc-luong-tu-2026', 'rev-y-hoc-luong-tu-2026', 'art-y-hoc-luong-tu-2026:rev-y-hoc-luong-tu-2026',
  'dot-pha-y-hoc-luong-tu-ung-dung-cam-bien-sinh-hoc-trong-chan-doan-som', 'khoa-hoc',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
  'Đột phá y học lượng tử: Ứng dụng cảm biến sinh học mới',
  'Nghiên cứu đột phá về cảm biến lượng tử mở ra khả năng chẩn đoán sớm mầm bệnh ở cấp độ phân tử, tạo bước tiến lớn cho nền y học chính xác tương lai gần.',
  'https://mstudio.minds.io.vn/bai-viet/dot-pha-y-hoc-luong-tu-ung-dung-cam-bien-sinh-hoc-trong-chan-doan-som',
  'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
  'y học lượng tử, cảm biến sinh học, chẩn đoán sớm, công nghệ nano, y học chính xác',
  1, 95.0, 0, 0,
  '2026-10-13T06:25:00.000Z', '2026-10-13T06:25:00.000Z'
);

INSERT OR REPLACE INTO article_revisions (
  id, article_id, revision_number, title, body, summary, created_at
) VALUES (
  'rev-y-hoc-luong-tu-2026', 'art-y-hoc-luong-tu-2026', 1,
  'Đột phá y học lượng tử: Ứng dụng cảm biến sinh học trong chẩn đoán sớm',
  'Bước tiến vượt bậc trong công nghệ vật liệu lượng tử đang mở ra cánh cửa mới cho lĩnh vực y tế dự phòng, cho phép các bác sĩ nhận diện những biến đổi bệnh lý siêu nhỏ trước khi xuất hiện triệu chứng lâm sàng rõ rệt.

## Thông tin xác thực (Facts)

- Thiết bị cảm biến lượng tử mới có khả năng phát hiện dấu ấn sinh học của tế bào lạ sớm hơn từ 12 đến 18 tháng so với kỹ thuật xét nghiệm truyền thống.
- Thử nghiệm lâm sàng bước đầu cho thấy độ chính xác đạt trên 98,5% trên mẫu huyết thanh thể tích cực nhỏ.

## Nhận định & Tuyên bố (Claims)

- Sự kết hợp giữa công nghệ lượng tử và y học cá thể hóa sẽ tạo nên cuộc cách mạng trong điều trị ung thư và các bệnh lý phức tạp.
- Chi phí sản xuất cảm biến sinh học thương mại dự kiến sẽ giảm mạnh trong vòng 3 năm tới nhờ tối ưu hóa dây chuyền bán dẫn.

Công nghệ này hứa hẹn sẽ sớm được đưa vào quy trình khám chữa bệnh định kỳ, giúp giảm tải chi phí điều trị đắt đỏ và tăng cơ hội sống sót cho bệnh nhân.

## Tin liên quan cùng chuyên mục
- [Hiện tượng đa bão nhiệt đới dồn dập: Giải mã cơ chế khí quyển cực đoan](https://mstudio.minds.io.vn/bai-viet/hien-tuong-da-bao-nhiet-doi-don-dap-giai-ma-co-che-khi-quyen-cuc-doan)

*Đọc thêm các diễn biến mới nhất tại chuyên mục [Khoa học](https://mstudio.minds.io.vn/chuyen-muc/khoa-hoc).*',
  'Bước tiến vượt bậc trong công nghệ vật liệu lượng tử đang mở ra cánh cửa mới cho lĩnh vực y tế dự phòng.',
  '2026-10-13T06:25:00.000Z'
);
