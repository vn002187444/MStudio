# Báo cáo QA & Kiểm toán - MStudio Channel
**Ngày:** 09-10-2026

## 1. Kiểm tra Lịch sử Commit
Tất cả các commit tính năng/sửa lỗi gần đây trong nhánh `main` đã được kiểm toán dựa trên các yêu cầu PR/Handoff của `AGENTS.md`. Các commit sau đây bị thiếu các trường báo cáo bắt buộc:
- **Commit ec8f11a** (fix(api): boot workerd and serve published articles): Thiếu các trường PR bắt buộc: Changed paths, Acceptance evidence, Tests executed, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 50cee9b** (feat(MST-062): For You Follow Hide UX (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 67ef0c5** (feat(MST-060): reader event pipeline): Thiếu các trường PR bắt buộc: Changed paths, Acceptance evidence, Tests executed, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 9fcba6d** (feat(MST-051): search topic entity UX (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 1b456f9** (feat(MST-042): public article and category templates (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 8d77365** (feat(MST-040): Article Editor (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks
- **Commit 1669f25** (feat(MST-032): AI Desk and agent history (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks, Follow-ups
- **Commit 53ce55d** (feat(MST-009): Incoming UI integration with real data (opencode)): Thiếu các trường PR bắt buộc: Changed paths, Cloudflare quota impact, Known risks, Follow-ups

*Khuyến nghị:* Các PR trong tương lai nên tuân thủ nghiêm ngặt định dạng YAML `Handoff` trong phần mô tả PR/thông điệp commit như được định nghĩa trong `AGENTS.md` (ví dụ: báo cáo `changed_paths`, `quota_impact`, `risks`, v.v.).

## 2. Kiểm tra Chức năng (Functional Testing)
Một chu trình đầy đủ gồm `pnpm install`, `pnpm typecheck`, `pnpm build`, và `pnpm test` đã được chạy trên toàn bộ workspace.

- **Typecheck:** Tất cả các dự án đều vượt qua `tsc --noEmit`.
- **Build:** Tất cả các ứng dụng (apps) và workers đều build thành công.
- **Tests:** Phát hiện một lỗi race-condition do timeout trong `packages/ai/model-gateway/src/gateway.test.ts` và một vấn đề về tính nhất quán khi sắp xếp trong `workers/normalize/src/normalize.test.ts`. Cả hai file test này đã được vá để pass một cách ổn định. Sau khi sửa lỗi, **tất cả các bài test trên toàn workspace đều pass**.

## 3. Kiểm toán Tĩnh UI/UX
Mã nguồn (`apps/web`, `apps/studio`) đã được phân tích tĩnh dựa trên các đặc tả UI/UX trong `PLAN.md`.

- **Tokens:** Các biến CSS được sử dụng đúng theo đặc tả (ví dụ: `--black`, `--soft`, `--breaking-red`). Không tìm thấy các màu hardcoded "magic" không hợp lệ trong các components.
- **Motion & Hiệu ứng:** Không tìm thấy các hiệu ứng hình ảnh bị cấm (ví dụ: 3D tilt, infinite marquees, glows).
- **Quan sát về Styling:** `apps/studio` sử dụng rất nhiều các object `style={{ ... }}` inline (ví dụ: `style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24 }}`). Mặc dù về mặt chức năng thì hoạt động tốt và sử dụng đúng các tokens, nhưng tốt hơn là nên sử dụng các utility classes của Tailwind (vì Tailwind đã được import trong globals.css) để tăng hiệu suất và dễ bảo trì hơn.

## 4. Đánh giá Tổng quan
Dự án build và vượt qua quá trình testing một cách chính xác sau khi các bài test được sửa lỗi. UI/UX tuân thủ đúng chiến lược token được vạch ra trong `PLAN.md`. Kỷ luật về commit cần được cải thiện để đáp ứng các yêu cầu khắt khe của PR.

## 5. Follow-ups từ PROPOSAL.md (nhánh `feat/MST-000-jules-proposal`, đã đóng không merge)
Trích 8 ý mới (không trùng `PLAN.md`) từ proposal của Jules, đã đối chiếu ngày 09-10-2026. File proposal gốc stale (viết trên base cũ) nên chỉ giữ các items dưới đây.

### 5a. Cần Human duyệt policy
- **FU-02 Zod shared validation**: dùng Zod chung cho Hono API + Next.js form validation (edge-safe). Ghi nhận: `workers/api/src/validate.ts` đã dùng Zod qua merge `refactor-validation-zod`; còn lại form validation phía Studio/Web chưa chuẩn hoá — Human xác nhận phạm vi áp dụng.
- **FU-06 Auto internal-link**: AI quét Entity/Topic trong DB, tự chèn contextual anchor giữ chân độc giả khi sinh bài. Cần Human duyệt editorial policy (quy tắc chèn link, giới hạn mật độ, loại trừ tin nhạy cảm).
- **FU-07 Review-gate policy**: tin nhạy cảm/"góc tối" bắt buộc Human Editor flag/duyệt; tin thường auto-eligible nếu AI confidence đạt ngưỡng. Cần Human định nghĩa taxonomy nhạy cảm + ngưỡng confidence.

### 5b. Tech ADR (quyết định kỹ thuật, đề xuất ghi ADR)
- **FU-01 Radix/Shadcn copy-in**: copy file component (Dialog, Dropdown, Tabs) trực tiếp vào `packages/ui`, không cài dependency nặng — đảm bảo WCAG 2.2 AA ngay từ đầu.
- **FU-03 nuqs**: đồng bộ state filter/search CMS lên URL param để share link giữa các editor.
- **FU-04 Không React Query** trong App Router trừ khi cần client polling; dùng native fetch + cache tags + Server Actions (tiết kiệm JS client, bảo vệ INP).
- **FU-05 Tiptap/Lexical**: headless editor cho blocks Quote/Fact-Claim/Timeline phục vụ CMS AI-driven (liên quan follow-up MST-040).

## 6. Gaps phát hiện khi re-evaluate (09-10-2026, đã kiểm chứng độc lập)
- **G-01 `.gitignore` thiếu `.env*`**: chỉ có `.dev.vars`. Chưa có secret nào bị track (scan 186 files sạch), nhưng phải vá trước khi repo public/rộng hơn. → FU-08.
- **G-02 Stray marker trong nhánh MST-062**: 1 dòng `>>>>>>>` sót từ rebase, đã dọn trong lúc merge (`05cdce1`), `git diff --check` + `git grep` sạch. → Resolved, không cần task.
- **G-03 Backlog thiếu Auth/RBAC + category expansion**: QC phát hiện từ trước, `PLAN.md` đã yêu cầu RBAC (mục Security) nhưng chưa có task thực thi. → FU-10, FU-11.
- **G-04 Scheduler concurrency treo quyết định**: 2 biến thể (`Promise.all` / `allSettled`) đổi hành vi ingest hot path + quota burst risk, chưa merge. Bench file đã lấy vào main. → FU-12.
- **G-05 Deploy kẹt**: cần CF credentials + `wrangler queue create mstudio-events` + deploy api/analytics + D1 migrations 0001–0006. Chưa có deploy runbook chuẩn. → FU-13, FU-14.

---

# Báo cáo Kiểm toán Hàng ngày & Điều phối Jules Cloud (04-11-2026)

## 1. Kiểm toán Hạ tầng Backend & Sức khỏe Dịch vụ (Dual-Hosting Strategy)
- **Primary API Backend (BKNS Hosting SSD):** `https://api-mstudio.minds.io.vn/healthz` $\rightarrow$ **Status 200 OK** (Hạ tầng Node.js 22 + SQLite D1 Adapter chạy trực tiếp trên SSD, zero subrequest limits, không phụ thuộc Cloudflare Free Tier quota).
- **Fallback API Worker (Cloudflare D1):** `https://api.mstudio.minds.io.vn/healthz` $\rightarrow$ **Status 200 OK** (`environment: production` - Cơ chế dự phòng an toàn).
- **Studio CMS Worker:** `https://studio.vn002187444.workers.dev/login` $\rightarrow$ **Status 200 OK**.
- **Web Reader Edge:** `https://mstudio.vn002187444.workers.dev/` $\rightarrow$ **Status 200 OK**, Edge Latency: `1,527ms`.
- **Thống kê Tin tức & Bài viết (24h):**
  - Tổng số bài viết đã xuất bản: `50` bài.
  - Số bài mới xuất bản trong 24h qua: `50` bài.
  - Bài viết mới nhất: *"EVNCPC dồn toàn lực hoàn thành các mục tiêu chiến lược năm 2026"* (Publish time: `2026-11-04T01:00:44.580Z`).

## 2. Đo kiểm Hiệu năng & Kế hoạch Hạ TBT (Lighthouse Audit)
- **SEO Score:** `100 / 100` ⭐
- **Accessibility Score:** `96 / 100` ⭐
- **Performance Score:** `56 / 100`
- **Core Web Vitals:**
  - `FCP`: 2.4s | `LCP`: 2.4s
  - `CLS`: 0.083 (Rất tốt, đạt chuẩn Google Green < 0.1)
  - `TTFB`: 630ms
  - `TBT (Total Blocking Time)`: 3,400ms $\rightarrow$ **Điểm nghẽn cốt lõi cần giải quyết ở Client-side**.
- **Kế hoạch Hành động Hạ TBT & Tăng Điểm Performance (Target: ≥ 85/100):**
  1. **Trì hoãn Canvas Hero3D (`Hero3D Deferral`):** Tách `Hero3D` ra khỏi luồng hydration chính, chỉ kích hoạt animation loop sau khi browser rảnh (`requestIdleCallback`) hoặc khi component trượt vào viewport.
  2. **Tối ưu hóa Thẻ Tin tức (`NewsCard Memoization`):** Bọc `React.memo` cho `LeadStoryCard`, `CompactNewsCard`, `FeaturedCard` trong `news-card.tsx`; bổ sung `decoding="async"` trên toàn bộ thẻ `<img>`.
  3. **Tải trễ Widget Nặng Dưới Nếp Gấp (`Lazy Below-the-fold Widgets`):** Ứng dụng `dynamic(..., { ssr: false })` hoặc CSS `content-visibility: auto` cho `AIBenchmarkWidget`, `BentoMarketStrip`, `CrisisTimeline` để giảm tải render ban đầu.
  4. **Tối ưu Kích thước Bundle Client:** Phân tách vendor chunks (`framework`, `react`, `vinext`) để giảm parse/compile time của JavaScript.

## 3. Kiểm định Chức năng Tự động (Remote QC/QA Automated Suite)
- **Tổng số bài test đã chạy:** `107` checks.
- **Kết quả:** `107 / 107 Passed` (**100% Pass Rate**, 0 Failed, 0 Warnings).
- **Phạm vi kiểm định:**
  - 17 Core Routes, Taxonomies & Sitemaps (`/thoi-su`, `/kinh-te`, `/cong-nghe`, `/khoa-hoc`, `/the-thao`, `/the-gioi`, `/doi-song`, `/giai-tri`, `/ai-channel`, `feed.xml`, `robots.txt`, sitemaps).
  - CMS Redirects (`/cms`, `/admin`, `/studio` -> `302` chuyển hướng bảo mật sang `/login`).
  - Kiểm định sâu bài viết: Loại bỏ hoàn toàn ký tự thoát thô `\n\n`, chuyển đổi Markdown Heading sang semantic `<h2/h3>`, Table of Contents tự động, Schema `NewsArticle` JSON-LD, thẻ Canonical, OpenGraph và chuẩn WCAG `lang="vi"`.

## 4. Kiểm toán Toàn vẹn Mã nguồn Monorepo
- **Typecheck (`pnpm -r typecheck`):** Pass 100% (0 lỗi trên toàn bộ 18 workspaces).
- **Unit & Integration Test Suite (`pnpm -r test`):** Pass 100% (Toàn bộ test suites `contracts`, `db`, `workers/api`, `workers/normalize`, `workers/ingest`, `workers/publish`, `quota-guard`, `model-gateway` đều pass).

## 5. Tình trạng Điều phối Jules Cloud Agent
- **PR #60 (Palette - `apps/studio` Accessibility):**
  - Đã audit diff, verify tính tương thích qua `pnpm typecheck` và `pnpm test`.
  - **Squash & Merge** thành công vào nhánh `main`.
- **PR #61 (Palette - `apps/studio` Email Compose ARIA Grouping):**
  - Đã audit diff, verify tính tương thích.
  - **Squash & Merge** thành công vào nhánh `main`.
- **Jules Session `13962887518216700195` (Bolt - Performance Agent):**
  - Đã tái sử dụng session hiện hữu (tuân thủ Rule 6).
  - **Điều chỉnh trọng tâm kiến trúc:** Vì backend đã vận hành trên máy chủ BKNS Hosting (không còn lo ngại hạn mức 50 subrequests của Cloudflare D1 Free Tier), nhiệm vụ tiếp theo của Bolt được định hướng tập trung vào **Client-side Performance & TBT reduction** trên `apps/web`.
  - Bolt đã hoàn thành bước tối ưu hóa ban đầu, test pass và đang tiến hành mở PR.
