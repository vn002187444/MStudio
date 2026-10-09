# Báo cáo Trạng thái & Đề xuất Nâng cấp Hệ thống - MStudio Channel

Dựa trên quá trình khảo sát toàn bộ mã nguồn, cấu trúc dự án hiện tại (`backlog.yaml`, `PLAN.md`, `AGENTS.md`) và yêu cầu từ hệ thống quản lý, dưới đây là báo cáo tổng thể cũng như các đề xuất nhằm hoàn thiện và tối ưu hóa hệ thống.

---

## 1. Kiểm tra trạng thái CMS
- **Hiện trạng:** Hệ thống CMS (`apps/studio`) hiện đang ở giai đoạn khởi tạo (Foundation - Sprint 1 theo `backlog.yaml`). Các thư mục routing như `/newsroom/incoming`, `/newsroom/research` đã được tạo khung (placeholder) nhưng hoàn toàn chưa có chức năng (CRUD, giao diện chức năng, API fetch).
- **Kết luận:** CMS **chưa hoàn thiện**. Nó cần được phát triển các component UI, luồng tương tác với các hệ thống backend API (`workers/api`) và kết nối với cơ sở dữ liệu D1.
- **Next steps:** Thực hiện ngay các task tiếp theo của Sprint 1, bắt đầu với `MST-005` (Studio shell and Incoming placeholder) để xây dựng UI shell và `MST-006` (Source Manager API) để có API phục vụ việc kéo dữ liệu nguồn.

---

## 2. Nâng cấp UI/UX của CMS & Tối ưu cho Mobile
- **Tuân thủ PLAN.md:** Hiện tại, hệ thống đã định nghĩa một số token CSS (trong `packages/ui/tokens.css`) với triết lý "Black & White editorial", không lạm dụng màu sắc ngoại trừ các accent color (như `--ai-blue`, `--breaking-red`).
- **Tối ưu Mobile (Mobile-first CMS):**
  - CMS truyền thống thường bỏ qua mobile, nhưng để đội ngũ biên tập (Editor) có thể thao tác (duyệt bài, xem thông báo, xem sửa lỗi nhanh) trên điện thoại, giao diện cần được chia theo dạng "Drawer/Bottom Sheet" cho các menu phụ thay vì Sidebar dài.
  - Sử dụng layout 1 cột cho list view trên mobile (ví dụ `Incoming list`), chuyển các thao tác (Action: Accept, Reject) vào các menu popup (DropdownMenu).
  - Tăng vùng chạm (touch target) tối thiểu lên 44x44 CSS px theo yêu cầu của `PLAN.md`.
- **Nâng cấp Component:** Khuyến nghị tích hợp và sử dụng các Headless UI component (ví dụ: Radix UI, Shadcn-UI nếu có thể tuân thủ thiết kế hiện tại) để đảm bảo Accessibility (WCAG 2.2 AA) và khả năng tương tác tốt ngay từ đầu.

---

## 3. Tương thích Cloudflare (Free tier)
Dự án được thiết kế với tư duy Cloudflare-first, Free-tier-first. Để tránh vượt quá dung lượng và quota:
- **Workers & API:** Tránh các tính toán AI nặng nề trên reader request. Các tác vụ này (như embedding, parsing html) phải đẩy xuống **Cloudflare Queues** và xử lý ngầm.
- **Database (D1):** Tối ưu hóa truy vấn. Tránh SELECT *, luôn luôn phân trang (pagination) và phải có index (`CREATE INDEX`) cho các trường thường xuyên filter (như `status`, `published_at`).
- **Cache (KV/R2):** Với các bài viết đã public, cần cache nội dung tĩnh hoặc sử dụng ISR (Incremental Static Regeneration) của Next.js adapter trên Cloudflare.
- **QuotaGuard:** Theo `PLAN.md`, hệ thống cần một "QuotaGuard" theo dõi lượng request để tự động chuyển mode (NORMAL -> WARN -> SAFE -> STOP) như tạm ngừng crawler nếu sắp hết quota.

---

## 4. Đề xuất Cải tiến UI/UX, BE, CMS & Hiệu ứng Thị giác
- **Hiệu ứng thị giác (Visual Effects):**
  - Tuân thủ nguyên tắc "Quiet interaction" từ `PLAN.md`.
  - Thay vì dùng hiệu ứng 3D tilt, glow, parallax hay infinite marquee, hãy dùng:
    - **Hover trên bài viết (News Card):** Thay đổi nhẹ màu viền hoặc màu nền của card (`subtle_surface_or_border_change`).
    - **Hover ảnh (Thumbnail):** Phóng to ảnh nhẹ (`scale 1.02`) bên trong một vùng `overflow: hidden`.
    - **Navigation/Link:** Dùng gạch chân nhẹ (`subtle_underline_or_color`).
  - Sử dụng chung thời gian hiệu ứng: `transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Backend Kiến trúc:**
  - Giữ Hono API nhẹ nhất có thể.
  - Tách bạch rõ: API cho người dùng đọc (Read) lấy từ Cache/D1 siêu tốc, API cho CMS (Write/Review) đi qua Hono + Auth nghiêm ngặt.

---

## 5. Luồng Đăng bài & Điều phối Nội dung tăng Viewer & SEO
- **Luồng xuất bản (Publishing flow):**
  - Crawler lấy tin (Raw Item) -> AI loại bỏ trùng lặp (Normalize) -> AI nhóm tin (Cluster) -> Trích xuất Fact/Claim -> Editor kiểm duyệt trên UI -> **AI Writer** sinh bài cuối cùng kèm SEO data.
- **Đề xuất tăng hiệu năng & điều phối:**
  - **Tự động đề xuất internal link:** Khi AI tổng hợp bài, AI phải quét qua danh sách Entity/Topic (nhân vật, tổ chức) đã có trên DB và tự chèn link ngữ cảnh (Contextual Anchor) để giữ chân độc giả.
  - **Review Gate:** Đối với các tin "Góc tối" hay "Nhạy cảm", bắt buộc phải cờ (flag) cho Human Editor duyệt. Tin công nghệ bình thường có thể vào luồng tự động (Auto-eligible) nếu độ tin cậy của AI đạt cao.

---

## 6. Kiểm tra Lighthouse & Đề xuất cải tiến
- Hiện tại trang Web (Next.js) chưa render được nội dung thực tế để test Lighthouse. Tuy nhiên, để đạt Core Web Vitals mục tiêu:
  - **LCP <= 2.5s:** Preload ảnh Hero (`priority` trong `next/image`). Không lazy-load ảnh trên màn hình đầu tiên (above the fold).
  - **CLS <= 0.1:** Bắt buộc đặt kích thước (`width/height` hoặc `aspect-ratio`) cho mọi hình ảnh và iframe video (youtube) để không làm nhảy layout khi load.
  - **INP <= 200ms:** Hạn chế Javascript ở phía Client. Sử dụng React Server Components (RSC) mặc định. Các component tương tác nhỏ (như Nút bấm, Tabs) mới dùng `"use client"`.

---

## 7. OG, Slug, Metadata & Tiện ích Widget
- **Metadata & OG:**
  - Sử dụng Next.js Metadata API ở trong layout và page (`generateMetadata`) thay vì tự chèn thẻ `<meta>`.
  - Ảnh OG nên tự động render bằng Next.js `ImageResponse` (edge) dựa trên tiêu đề bài viết để có tính nhất quán.
- **Slug:** Định dạng `[category]/[...slug]`. Ví dụ: `/cong-nghe/ai-phat-trien-2026-12345`. (id tĩnh ở cuối để dễ tra cứu db mà không sợ đụng slug).
- **Mục lục (Table of Contents - ToC):** Tự động extract từ các thẻ `<h2>`, `<h3>` của bài viết và render ra một widget Sticky bên góc màn hình trên Desktop.
- **Sitemap:** Cần sinh động tự động thông qua Worker (vì sitemap tin tức `sitemap-news.xml` phải cập nhật trong vòng 2 ngày gần nhất cho Google News). Không cài plugin sitemap phức tạp, dùng custom route của Hono/Next.js trả về XML thuần là tốt nhất.

---

## 8. Đề xuất Thư viện Tích hợp & Tối ưu
Do đang chạy trên Cloudflare (Edge/Workers), hệ thống cần các thư viện tương thích Edge runtime, nhẹ và hiện đại:
- **UI Framework / Component:**
  - Tailwind CSS (để dễ dàng sử dụng lại các token `--black`, `--ai-blue`).
  - Radix UI Primitives hoặc Shadcn-UI (copy trực tiếp file vào `packages/ui` thay vì cài dependency nặng nề) để đảm bảo Accessibility cho Dialog, Dropdown, Tabs.
- **Validation:**
  - Zod. Đã chứng minh cực kỳ hiệu quả và an toàn trên Edge runtime. Phục vụ chung cho cả Hono API và Next.js Form validation.
- **Quản lý State URL / Form:**
  - Nuqs (next-usequerystate): Thư viện cực kì nhẹ giúp đồng bộ state form (ví dụ bộ lọc CMS, thanh tìm kiếm) với URL param (chia sẻ link tìm kiếm cho Editor khác dễ dàng).
- **Fetch / Data Fetching:**
  - Hạn chế sử dụng React Query bên trong Next.js App Router nếu không thực sự cần client side polling. Dùng Native Fetch với caching tags của Next.js kết hợp Server Actions.
- **Editor / CMS:**
  - Tiptap (hoặc Lexical) là các thư viện editor dạng headless nhẹ, có thể dễ dàng customize khối (block) như Quote, Fact/Claim, Timeline phù hợp với yêu cầu AI-driven CMS.

---

**Bản báo cáo này đã được đối chiếu với `PLAN.md` và tuân thủ các quy tắc trong `AGENTS.md`. Nó sẽ đóng vai trò như một bản hướng dẫn chiến lược cho các task tiếp theo của Sprint 1.**
