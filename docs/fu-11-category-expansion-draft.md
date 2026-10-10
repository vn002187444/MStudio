# FU-11 Category expansion — DRAFT (chờ Human duyệt phạm vi)

> Trạng thái: bản nháp do OpenCode soạn theo chỉ đạo Human. Human duyệt
> taxonomy + phân công owner rồi mới tách task MST.

## Hiện trạng (10 mục, `apps/web/components/navigation/taxonomy.ts`)
Mới nhất, Dành cho bạn, Đang nóng, Thế giới, Công nghệ, AI Channel,
Giải trí, Khám phá, Đời sống, Góc Tối.

## Vấn đề
- Taxonomy đang hardcode trong FE, chưa có bảng DB / CMS quản trị.
- Chưa rõ mục nào là feed-thật (có route + dữ liệu) và mục nào là placeholder.
- `Góc Tối` thuộc diện nhạy cảm → liên quan FU-07 review-gate policy.

## Đề xuất mở rộng (2 pha)
**Pha 1 — DB-backed taxonomy (nhỏ, nên làm trước):**
- Bảng `categories (slug PK, label_vi, parent_slug?, sort, status)` + seed 10 mục hiện tại.
- API `GET /categories`, CMS list/reorder (sau FU-10 auth).
- FE đọc từ API có fallback hardcode (không vỡ khi API chậm).

**Pha 2 — Mục mới (Human quyết danh sách):**
- Ứng viên: Kinh doanh, Thể thao, Sức khỏe, Giáo dục, Du lịch, Xe/Tech.
- Mỗi mục mới cần: nguồn feed (MST-006 Source Manager), template MST-042 đã có sẵn
  nên chỉ cần map slug → template, SEO metadata (MST-050).

## Câu hỏi cho Human
1. Chốt danh sách mục pha 2 (tối đa mấy mục để giữ free-tier + editorial capacity)?
2. `Góc Tối` giữ hay đổi tên + áp review-gate (FU-07)?
3. Owner pha 1: commandcode (DB/API) + opencode (FE binding) — tách 2 task hay 1 task chung?

## Human decisions (10-10-2026)
1. Pha 2: GIỮ 4 mục — Kinh doanh, Sức khỏe, Giáo dục, Xe. BỎ Thể thao, Du lịch (pha sau).
2. `Góc Tối`: GIỮ tên, KHÔNG review-gate bắt buộc (Human 10-10-2026, override).
3. Pha 1: TÁCH 2 task — MST-071 (cmdc: bảng categories + API) + MST-072 (opencode: FE binding + fallback hardcode).
