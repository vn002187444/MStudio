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
