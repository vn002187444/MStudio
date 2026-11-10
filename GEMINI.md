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



15. **Quy tắc Vận Hành Database & Danh Mục DB Hiện Hữu trên BKNS (BKNS Database Matrix Protocol - BẮT BUỘC):**
   - **Danh mục Cơ sở Dữ liệu Đang Hoạt Động (Production DB Registry):**
     * **PostgreSQL:** `mindsiov_autoseo` (User: `mindsiov_admin`, port `5432`) $\rightarrow$ Phục vụ backend **AutoSEO** (`api.autoseo.minds.io.vn`). **TUYỆT ĐỐI KHÔNG XÓA**.
     * **MySQL:** `mindsiov_bloodwar` (User: `mindsiov_rxsg`, port `3306`, ~84.3 MB) $\rightarrow$ Phục vụ **Webgame Tam Quốc** (`rxsg.minds.io.vn`, `tamquoc.minds.io.vn`). **TUYỆT ĐỐI KHÔNG XÓA**.
     * **MySQL:** `mindsiov_bkwp` (User: `mindsiov_bkwpu`, ~656 KB) $\rightarrow$ Phục vụ **WordPress Bách Khoa** (`bk.minds.io.vn`).
     * **Native SQLite SSD:** `deploy/bkns-api/data/mstudio.db` (~18.5 MB, 3,081 bài viết) $\rightarrow$ Phục vụ **MStudio Channel Backend** (`api-mstudio.minds.io.vn`). Chạy qua Node 24 `node:sqlite` (`DatabaseSync`), latency < 1ms, zero network hop.
     * **Native SQLite SSD:** `data/zaloagents.db` $\rightarrow$ Phục vụ **ZaloAgent** (`zaloagent.minds.io.vn`).
   - **Khuyến nghị Kiến trúc Backend Node.js mới:**
     * Ưu tiên số 1: Dùng **Native SQLite trên SSD** (`DatabaseSync` của Node 24 tại `/opt/alt/alt-nodejs24/root/usr/bin/node`). Vừa tiết kiệm 100% RAM nuôi daemon DBMS vừa triệt tiêu nghẽn connection pool.
     * **Bắt buộc bảo toàn DB khi Deploy:** Khai báo thư mục database vào `shared_dirs` trên VibeCode Deploy (ví dụ: `deploy/bkns-api/data`) để tự động giữ nguyên vẹn file `.db` qua mọi đợt deploy/rollback.
   - **Quy tắc An Toàn Xóa DB (Zero-Accidental-Loss):**
     * Máy chủ BKNS chỉ duy trì các DB hợp lệ nêu trên. Các DB rác cũ (`mindsiov_aaa`, `mindsiov_mindsiov_`, `mindsiov_db`) đã được dọn sạch.
     * Nghiêm cấm tự ý chạy lệnh drop database nếu chưa quét toàn diện `.autodeploy/config.json`, file `.env` và mã nguồn trong `public_html`. Bắt buộc xin xác nhận từ User trước khi xóa.

16. **Quy tắc Bảo Vệ Quota Cloudflare D1 & Kiến Trúc Lai (Hybrid Edge + Host Architecture):**
   - Free tier Cloudflare D1 chỉ có 100,000 write rows/ngày. Tuyệt đối không để background cron jobs cào tin (ingest/normalize) chạy liên tục trên Cloudflare ghi trực tiếp vào D1.
   - BẮT BUỘC cấu hình `"crons": []` trong toàn bộ `workers/*/wrangler.jsonc` để CI/CD không vô tình bật lại cron trên Cloudflare Workers khi deploy.
   - Luồng cào tin RSS nặng chuyển hoàn toàn sang BKNS Native SQLite SSD (`deploy/bkns-api/ingest.js` chạy Node 24 `node:sqlite`). Cloudflare D1 đóng vai trò Hot Standby (Disaster Recovery).
   - Cloudflare Edge Worker (`mstudio`) phụ trách phân phối toàn cầu, SSR và Edge Caching (TTL 60s - 300s).

17. **Quy tắc Đồng Bộ Delta Định Kỳ D1 (Daily D1 Delta Synchronization Protocol):**
   - Đồng bộ dữ liệu mới từ BKNS sang Cloudflare D1 duy nhất 1 lần/ngày vào lúc 02:00 AM VN (`0 19 * * *`) qua GitHub Actions (`daily-d1-sync.yml`) hoặc script `scripts/sync-bkns-to-d1.mjs`.
   - Script so sánh `MAX(created_at)` trên D1 với delta trên BKNS (`/api/admin/delta`), chỉ ghi các bản ghi mới theo batch 30 câu lệnh. Nếu không có thay đổi, tiêu tốn đúng 0 write rows (`status: UP_TO_DATE`).

18. **Quy tắc Phân Loại Bot Thông Minh & Chặn Scraper 0.01ms (AI SEO vs Anti-Scraper Gatekeeper):**
   - Mọi ứng dụng web/API phải phân loại bot tại Edge Middleware (`apps/web/middleware.ts`) và cổng Backend (`deploy/bkns-api/app.js`):
     * **Mở cửa 200 OK:** Cho phép 100% các bot AI tìm kiếm chính thống (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Applebot`, `Googlebot`, `Bingbot`), gắn kèm header `X-AI-Bot-Status: allowed-indexer` để đón đầu traffic AI Search / GEO.
     * **Chặn đứng 403 Forbidden:** Chặn ngay lập tức trong 0.01ms CPU các bot càn quét quá khích (`Reflectionbot`, `Bytespider`, `PetalBot`, `Amazonbot`), không cho request đi vào SSR hay query database.

19. **Quy tắc React 19 RSC Boundary & Cô Lập Hàm Tiện Ích (RSC Client Boundary Isolation Protocol):**
   - **Tuyệt đối không import hàm tiện ích / hằng số từ file `"use client"` vào Server Component**: Trong cơ chế bundling của Next.js / `vinext` / Rolldown, mọi export từ file có chỉ thị `"use client"` đều bị compiler chuyển hóa thành *Client Reference Proxy Object* (hoặc ID tham chiếu module). Khi Server Component (RSC) import và gọi hàm thường (ví dụ: `formatRelativeTime(date)` hay `CATEGORY_NAMES[...]`), nó sẽ quăng lỗi ngoại lệ `TypeError: ... is not a function` hoặc làm crash toàn bộ Server Component render gây HTTP 500 (`This page couldn't load`).
   - **Cô lập tầng tiện ích (Shared Pure Utils)**: Toàn bộ hàm format thời gian, chuẩn hóa chuỗi, từ điển category, và logic fallback ảnh BẮT BUỘC phải đặt trong các file thuần túy không có directive `"use client"` (ví dụ: `apps/web/lib/format.ts`). File Client Component có thể import từ file này hoặc re-export, nhưng Server Component CHỈ ĐƯỢC import từ file thuần túy.
   - **Bảo vệ toàn diện event handlers**: Mọi JSX component có chứa event handler (`onError`, `onClick`, `onChange`) hoặc React hooks (`useState`, `useEffect`, `useRef`) BẮT BUỘC phải có `"use client";` ở dòng đầu tiên.

20. **Quy tắc Trải Nghiệm Tải Trang & Nút Làm Mới Trực Tiếp (Loading & Error Recovery Protocol):**
   - Khi ứng dụng web phụ thuộc vào luồng dữ liệu thời gian thực hoặc các subrequests bất đồng bộ, BẮT BUỘC phải triển khai cặp file `loading.tsx` và `error.tsx` ở cấp route group (ví dụ: `app/(public)/loading.tsx` và `app/(public)/error.tsx`).
   - **Bổ sung nút Tải lại (Reload CTA)**: Trong trạng thái chờ (`loading.tsx`), phải luôn có thanh trạng thái hiển thị thời gian kết nối kèm nút bấm "↻ Tải lại" (cho phép người dùng chủ động refresh `window.location.reload()` thay vì bị động chờ đợi). Trong `error.tsx`, phải cung cấp cả 2 lựa chọn: "Tải lại trang" và "Thử lại (reset boundary)", kèm các đường dẫn nhanh đến các chuyên mục hoạt động bình thường, triệt tiêu hoàn toàn màn hình lỗi 500 mặc định thô kệch.

21. **Quy tắc Xử Lý Ảnh Đa Nguồn & Giải Mã Entity URL Query CDN (CDN Image Sanitization Protocol):**
   - Nhiều nguồn cấp tin tức (RSS/Atom như Tuổi Trẻ, VNExpress) mã hóa URL query params thành `&amp;` (ví dụ `img.jpg?w=600&amp;token=...`). Nếu render trực tiếp vào `src` của thẻ `<img>`, CDN của nhà cung cấp sẽ coi đó là query sai chữ ký số và trả về lỗi 401/403 khiến ảnh bị vỡ.
   - BẮT BUỘC phải qua hàm chuẩn hóa `getArticleImageUrl`:
     * Tự động replace `/&amp;/g` thành `&`.
     * Tích hợp `onError` tự động fallback về kho ảnh độ phân giải cao theo từng danh mục (`CATEGORY_FALLBACK_IMAGES`), không bao giờ để hiển thị khung ảnh vỡ hoặc ảnh rỗng.

22. **Quy tắc Container Responsive & Bố Cục PC Siêu Rộng (PC Responsive Container Standard):**
   - Không được hardcode giới hạn chiều rộng nội dung quá nhỏ trên desktop (như `max-w-3xl` / 768px trên các trang feed / danh sách).
   - Thiết lập CSS Tokens `--container` theo chuẩn PC hiện đại: từ 1480px (1024px) đến 1880px (1920px), tránh double padding (không lồng `px-8`/`px-10` bên trong container đã có `var(--gutter)`), đảm bảo các cột Bento Grid (3-6-3, 4-4-4, 8-4) luôn có không gian thở và tận dụng tối đa bề ngang màn hình PC mà không gây khoảng trắng thừa 2 bên.

23. **Quy tắc Độc Lập Timeout Signal Khi Gọi API Fallback (Resilient API Fetch Protocol):**
   - Khi cấu hình kiến trúc API có primary và fallback (Edge Worker API vs Host Backend SQLite): TUYỆT ĐỐI KHÔNG tái sử dụng cùng một `AbortSignal` hoặc `init` object cho cả 2 lượt gọi. Khi primary bị timeout sau $N$ ms, signal đã ở trạng thái `aborted`, nếu mang sang fallback sẽ khiến fallback bị ngắt ngay lập tức với `AbortError`.
   - Mỗi lượt gọi fetch BẮT BUỘC tạo `AbortSignal.timeout(...)` độc lập hoàn toàn, và lớp cuối cùng phải luôn trả về payload JSON mặc định hợp lệ (`{ rows: [], ... }`) với `status: 200` để các Server Components không bao giờ bị crash dây chuyền.

24. **Quy tắc Chuyển Đổi Lưu Trữ: Triệt Tiêu Cloudflare R2 Sang S3/MinIO Trên NAS (Zero-R2 S3-on-NAS Protocol - BẮT BUỘC):**
   - Dự án MStudio Channel và toàn bộ hệ thống đa tác nhân BẮT BUỘC KHÔNG dùng Cloudflare R2 cho lưu trữ media và assets thô (triệt tiêu 100% rủi ro trần chi phí, Class A/B operation limits và quota storage của Cloudflare Free Tier).
   - **Hạ tầng S3 Chuẩn Hóa Trên NAS TerraMaster TOS 6 (MinIO Storage Engine):**
     * **Public Endpoint (Internet/CDN):** `https://s3.minds.io.vn` (được bảo vệ và phân phối qua Cloudflare Tunnel `cloudflared-cv`).
     * **Internal Endpoint (LAN/Host):** `http://192.168.0.187:9000` (port `9000` S3 API, port `9001` Web Console).
     * **Credentials & Single Source of Truth:** `minioadmin` / `minioadmin_secure_pass_2026`, đã lưu trữ tập trung tại MinPanel Secret Vault (`s3:mstudio` & `s3:nas`).
     * **Danh mục Buckets Đã Khởi Tạo:**
       + `mstudio-media`: Lưu trữ ảnh/video bài viết, phân phối công khai qua CDN `https://s3.minds.io.vn/mstudio-media` (chính sách `download` public, chống lỗi 403 hotlink).
       + `mstudio-raw`: Lưu trữ payload tin tức cào thô và HTML snapshot.
       + `media`: Bucket media chung của hệ sinh thái.
       + `mstudio-storage`: Bucket backup & exports.
   - **Phân công trách nhiệm CommandCode CLI (`commandcode-ops`):**
     * Sử dụng S3 client tương thích (`@aws-sdk/client-s3` hoặc REST S3 endpoint) để thay thế hoàn toàn các thao tác với R2Bucket.
     * Cập nhật các biến môi trường cấu hình backend/worker trỏ sang MinIO S3 trên NAS thay vì binding Cloudflare R2.

