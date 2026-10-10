# FU-15 Media fallback chain A → B → C (Human đã duyệt hướng)

> Kết hợp cả 3 phương án proposal làm fallback cho nhau.

## Chuỗi fallback (FE `ArticleHero`, đã implement tầng C)
1. **A. Hotlink ảnh gốc + credit**: parser đã trích `imageUrl` từ
   enclosure/media:content/media:thumbnail/JSONFeed-image
   (`workers/normalize/src/parsers.ts`, chỉ http(s), có test).
   FE render `<img src=origin>` + credit nguồn. Dữ liệu chưa persist
   (đợi migration 0007).
2. **B. Rehost R2 chọn lọc**: chỉ ảnh licensed/official → `mstudio-raw`,
   bảng `media_assets` mới. Khi có `resolvedUrl`, FE ưu tiên dùng thay A.
3. **C. Placeholder CSS** (đã xong): gradient/pattern deterministic theo
   story id + typography, đúng `visual_effects_v1`, không ảnh thật.

## Còn lại (cmdc + Human)
- **Migration 0008 draft** (chưa apply, cần Human gate schema; đánh số 0008 vì 0007 dành cho auth FU-10):
  ```sql
  ALTER TABLE raw_items ADD COLUMN image_url TEXT;
  CREATE TABLE media_assets (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id) ON DELETE CASCADE,
    origin_url TEXT NOT NULL,
    r2_key TEXT,
    source TEXT, creator TEXT,
    rights_status TEXT NOT NULL DEFAULT 'unknown'
      CHECK (rights_status IN ('clear','licensed','unknown')),
    license TEXT, credit TEXT, caption TEXT, alt TEXT,
    width INTEGER, height INTEGER, asset_hash TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_media_article ON media_assets (article_id);
  ```
- **Rehost worker**: copy origin → R2 chỉ khi `rights_status` clear/licensed;
  unknown giữ hotlink A hoặc block publish theo FU-07.
- **Policy**: hotlink báo VN (A) là xám bản quyền — Human xác nhận cho chạy
  tạm + credit đầy đủ, tầng B thay dần.
