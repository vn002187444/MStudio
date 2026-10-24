# Antigravity 2.0 Multi-Agent SDLC Protocol

Dự án này áp dụng quy trình phát triển phần mềm chuẩn hóa 6 giai đoạn với đội hình Multi-Agent chuyên biệt:

---

## 1. Phân vai Biệt đội Agent (Squad Roles)

- **Antigravity 2.0 (Tổng chỉ huy & Kiến trúc sư trưởng):**
  - Tiếp nhận yêu cầu từ người dùng, làm rõ yêu cầu (`/grill-me`, `interview-me`).
  - Viết tài liệu đặc tả `implementation_plan.md`, `task.md` và xây dựng Type Contracts / API schemas.
  - Phân công nhiệm vụ cho các agent con và là chốt chặn phê duyệt cuối cùng.

- **OpenCode CLI (`opencode-frontend` - Chuyên gia Frontend & UI/UX Đỉnh cao):**
  - Đảm nhận toàn bộ mã nguồn Frontend, UI components (React, Next.js, Vue, Vite, Tailwind CSS).
  - Định hình phong cách thiết kế độc bản, hiện đại, mang đẳng cấp quốc tế theo chuẩn **Awwwards & Dribbble**.

- **Jules (`jules-cloud-worker` - Điều phối viên Cloud Async):**
  - Chuyên xử lý tác vụ nền đám mây qua Jules MCP.
  - Tự động tạo nhánh và mở Pull Request trên GitHub cho các tác vụ backend, viết integration test suites lớn, hoặc nâng cấp thư viện mà không làm nghẽn máy cục bộ.

- **CommandCode CLI (`commandcode-ops` - QC/QA & DevOps Gatekeeper):**
  - Chuyên viên thực thi terminal: Chạy test suite thực tế (`npm test`, `pytest`), linter, typecheck. Bắt log lỗi thực tế, không chấp nhận kết quả phỏng đoán.
  - Đóng gói container (Docker), kiểm tra staging và thực thi quy trình Deploy an toàn có cơ chế rollback.

---

## 2. Tiêu chuẩn Frontend & UI/UX Sáng tạo (Awwwards & Dribbble Benchmark)

Mọi sản phẩm giao diện do **OpenCode CLI** thực hiện BẮT BUỘC phải tuân thủ các tiêu chuẩn thẩm mỹ cao cấp:
1. **Tuyệt đối chống rập khuôn (Anti-Generic AI Design):** Không tạo giao diện "AI nhàm chán" với màu tím/xanh nhạt mặc định, bố cục hộp thô kệch hay card nhàm chán.
2. **Nghiên cứu & Áp dụng phong cách Awwwards:**
   - Nghệ thuật typography (Editorial serif kết hợp Modern geometric sans, phân cấp thị giác rõ ràng).
   - Bố cục bứt phá: Bento Grid, bố cục bất đối xứng có chủ đích (asymmetric layouts), không gian thở (whitespace) sang trọng.
   - Hiệu ứng thị giác: Gradient mesh mượt mà, subtle noise/grain texture, dark mode tinh tế có chiều sâu.
3. **Nghiên cứu & Áp dụng phong cách Dribbble:**
   - Micro-interactions sống động: Nút bấm có hiệu ứng từ tính (magnetic button), hover feedback phản hồi tự nhiên, card tilt/parallax nhẹ nhàng.
   - Chuyển động mượt mà (Spring physics animations với Framer Motion hoặc CSS transitions), đạt 60 FPS, không gây lag giao diện.
   - Trạng thái hoàn chỉnh: Có đầy đủ Skeleton loader, Empty state truyền cảm hứng, và Error state tinh tế.
4. **Tiêu chuẩn công thái học & Accessibility:** Chuẩn WCAG 2.1 AA, hiển thị xuất sắc từ mobile đến màn hình siêu rộng (responsive ergonomics).

---

## 3. Quy trình 6 bước chuẩn hóa (SDLC Lifecycle)

1. **Ý tưởng (Ideation):** Không viết code. Phỏng vấn làm rõ mục tiêu, phong cách mỹ thuật và user persona.
2. **Kế hoạch (Planning):** Định nghĩa Type Contracts trước (Interface, Schema). Chờ User phê duyệt `implementation_plan.md`.
3. **Phân công (Delegation):** Phân tách rõ ràng: Frontend $\rightarrow$ OpenCode; Cloud/PR/Backend $\rightarrow$ Jules; Test/Ops $\rightarrow$ CommandCode.
4. **Code (Implementation):** Thực thi trên nhánh Git riêng (`feat/...`), theo phương pháp TDD, commit nhỏ gọn (< 300 dòng).
5. **Audit / QC / QA (Kiểm định đối kháng):** Áp dụng nguyên tắc **Zero Self-Review**. CommandCode chạy test terminal; Subagents `code-reviewer` và `security-auditor` kiểm tra ở Fresh Context.
6. **Triển khai (Deploy):** Bắt buộc vượt qua pre-flight checklist: Test exit code = 0, git tree sạch, file `.env` hợp lệ và có kịch bản rollback dự phòng.

---

## 4. Quy tắc giao tiếp & bảo tồn Context
- Các subagent làm việc độc lập và chỉ gửi **Bản tóm tắt ngắn (Summary-Only Protocol)** về cho Lead Agent: (1) Trạng thái Pass/Fail, (2) Danh sách file thay đổi, (3) Lỗi cụ thể nếu có. Toàn bộ chi tiết lưu vào file `walkthrough.md`.
- Giữ context của Antigravity Lead luôn nhẹ và sắc bén để đưa ra quyết định kiến trúc chính xác.

---

## 5. Đúc kết Bài học & Bộ nhớ Kiến trúc (System Memory & Architecture Lessons)

> [!IMPORTANT]
> **GIAO THỨC BẮT BUỘC ĐỌC (MANDATORY PRE-TASK MEMORY CHECK):**
> Tất cả các Agents (Lead Orchestrator, OpenCode, Jules, CommandCode) BẮT BUỘC phải đọc và ghi nhớ toàn bộ các bài học trong mục này TRƯỚC KHI thực hiện bất kỳ nhiệm vụ nào. Tuyệt đối không để xảy ra sai sót lặp lại.

1. **Quy tắc Bento Grid & Tailwind CSS v4 (Monorepo Class Purging):**
   - Tuyệt đối không dùng chuỗi nội suy động (dynamic template literals như ``lg:col-span-${colSpan}``) trong các package dùng chung (`packages/ui`), vì Tailwind v4 / Rolldown không tự động quét các dynamic tokens từ external libraries khi build ứng dụng con.
   - Bắt buộc dùng Bảng tra cứu tĩnh (Static Lookup Table) kết hợp lớp định danh cứng (`.bento-col-1` đến `.bento-col-12` và `.bento-col-md-X`) được định nghĩa rõ ràng với `@media` và `!important` trong `globals.css` để đảm bảo lưới 12 cột chuẩn xác (8-4, 4-4-4, 3-6-3) trên mọi độ phân giải PC và Tablet.

2. **Quy tắc Thao tác Máy chủ NAS (TerraMaster TOS 6 & Coolify / Docker):**
   - Máy chủ NAS đã nâng cấp lên **TerraMaster TOS 6** (Linux kernel 6.x, nâng cấp bảo mật phân quyền container).
   - Lệnh `scp` sang NAS TerraMaster BẮT BUỘC phải kèm cờ `-O` (`scp -O ...`) vì SSH daemon TOS 6 mặc định hạn chế giao thức SFTP.
   - Phải luôn tạo trước thư mục đích trên NAS (`ssh -T nas "mkdir -p '...'`) trước khi copy các file hoặc route mới, tránh trường hợp tạo nhầm file thường thay vì thư mục.
   - Luôn duy trì giới hạn phần cứng an toàn (`cpus: '1.5'`, `max-old-space-size=1024`) trong cấu hình Docker để tránh kernel OOM-killer.

3. **Quy tắc Quản lý Chuyên mục & Chống Empty State:**
   - Mọi chuyên mục mới (hoặc khi tái định vị chuyên mục) phải đồng bộ đầy đủ 3 thành phần:
     1. File route Next.js (`apps/web/app/(public)/<chuyen-muc>/page.tsx`).
     2. Giao diện nhận diện đặc trưng (Theme Aura, Badges, Widget chuyên biệt trong `category-template.tsx`).
     3. Tối thiểu 1-3 bài viết thực tế đã publish trong Cloudflare D1 database (kèm script seed lưu tại `packages/db/seeds/`).

4. **Quy tắc Độ tương phản & Hai chế độ Sáng / Tối (Theme Switcher WCAG):**
   - Tuyệt đối không hardcode màu nền tối (`bg-slate-900`, `bg-[#07080B]`) hay chữ trắng (`text-white`) mà không kèm biến CSS hoặc selector `[html.light_&]`. Mọi card, nút bấm, và text đều phải đạt chuẩn WCAG AA/AAA trên cả nền sáng (Light Solar) và nền tối (Dark Void).
   - Mọi hoạt ảnh 3D/Canvas (như `Hero3D`) phải tự động nhận diện active theme (`html.light` hoặc `data-theme="light"`) để chuyển đổi màu nền, hạt và lưới tương ứng.

5. **Quy tắc Dữ liệu Thời gian Thực (Live Real-Time Feeds & Ground Truth):**
   - Mọi widget dữ liệu (AI Benchmark, VN30 / Market Tickers, Crypto) BẮT BUỘC kết nối nguồn API thực tế hoặc Cloudflare Worker background cron fetcher lưu trữ vào D1/KV. Tuyệt đối không dùng số liệu tĩnh giả lập không nguồn gốc khi đưa lên production.

6. **Quy tắc Điều phối Jules Cloud (Tái sử dụng Session khi sửa lỗi / Feedback Loop):**
   - Khi một tác vụ hoặc nhánh PR do Jules Cloud thực hiện cần sửa đổi, tinh chỉnh theo kết quả review hoặc sửa lỗi kiểm thử: BẮT BUỘC tiếp tục gửi yêu cầu follow-up trực tiếp trên chính Session ID hiện tại của Jules bằng `jules_send_message`.
   - TUYỆT ĐỐI KHÔNG tự ý tạo phiên mới (`jules_create_session` hay `jules_quick_session`) cho cùng một nhánh đang xử lý, nhằm bảo toàn ngữ cảnh làm việc liên tục, tránh phân mảnh PR trên GitHub và giữ trọn vẹn lịch sử đối thoại của Jules Agent.

