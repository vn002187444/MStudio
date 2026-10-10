# FU-10 Auth/RBAC — DRAFT (chưa duyệt, chưa code)

> Trạng thái: bản nháp do OpenCode soạn thay CommandCode theo chỉ đạo Human (override single-writer).
> CommandCode + Human review trước khi tách task MST và viết code.

## Mục tiêu
Bảo vệ API ghi/review (CMS) theo `PLAN.md` mục Security: roles
Admin/Editor/Reviewer/SEO/Analyst, audit sensitive changes, rate-limit
sensitive APIs. Reader API công khai (`GET /articles/:id`, `/recommendations`,
`/raw-items` nếu public) giữ nguyên không auth.

## Thiết kế đề xuất
1. **Session token trong D1**: bảng `sessions (token PK, user_id, role, expires_at)`.
   Token opaque 256-bit, gửi qua `Authorization: Bearer`, hash SHA-256 trước khi lưu.
2. **Hono middleware** `workers/api/src/auth.ts` (mới): verify token → gắn
   `{ userId, role }` vào context; `requireRole(...roles)` cho route nhạy cảm.
3. **Ma trận quyền (khởi điểm)**:
   - `POST /raw-items/accept|reject`, review/publish endpoints: Editor+ (Reviewer duyệt publish).
   - `/admin/*`, source allow/deny: Admin.
   - SEO/sitemap endpoints: SEO + Admin.
   - Đọc analyst: Analyst chỉ `GET` metrics.
4. **Rate-limit**: giới hạn riêng cho `/auth/*` + write endpoints (ví dụ 60 req/phút/IP),
   implement trong middleware (KV hoặc D1 counter — chọn KV cho rẻ quota).
5. **Audit log**: bảng `audit_log (actor, action, target, at)` cho mọi thay đổi
   sensitive (publish, correction/retraction, source allow/deny, role change).

## Ngoài phạm vi (giai đoạn sau)
OAuth/SSO, 2FA, API keys cho đối tác, UI quản trị user (làm sau khi CMS roles ổn định).

## Proposed backlog YAML (Human duyệt rồi mới thêm vào `backlog.yaml`)
```yaml
- id: MST-070
  title: Worker auth + RBAC + audit log
  owner: commandcode
  priority: P0
  paths: ["workers/api/**", "packages/db/**", "packages/contracts/**"]
  depends_on: [MST-041]
  human_gate: architecture
  acceptance: [bearer_session, role_matrix, rate_limit, audit_log, anon_reader_unaffected]
  tests: [auth-middleware-test, rbac-matrix-test]
  quota_impact: low
```

## Human decisions (10-10-2026, delegated to OpenCode on project reality)
1. Ma trận quyền: GIỮ như draft (Editor+ accept/reject+publish; Reviewer duyệt publish; Admin sources+roles; SEO sitemap; Analyst đọc metrics).
2. Session: D1 opaque token SHA-256 (không JWT — ít dep, đủ dùng, hợp free-tier).
3. Rate-limit 60 req/phút/IP cho write endpoints — OK.
→ Status: APPROVED, chuyển sang implement (migration sessions+audit_log + Hono middleware + tests).

## Human decisions 10-10-2026 (policy FU-02/06/07 + token)
- **FU-02 Zod forms: CÓ** — chuẩn hóa validation form Studio/Web bằng Zod (giống API). Task mới cho opencode.
- **FU-06 auto internal-link: CÓ** — AI tự chèn link entity vào bài.
- **FU-07 review-gate: KHÔNG** — tin nhạy cảm/Góc Tối không bắt buộc Human duyệt (ghi nhận rủi ro editorial, Human chịu).
- **CF token: KỆ** — giữ nguyên, không rotate (Human chấp nhận rủi ro shell history).
