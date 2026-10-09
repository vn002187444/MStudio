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

## Acceptance của FU-10 (draft)
- [ ] Human duyệt thiết kế + ma trận quyền
- [ ] CommandCode nhận task, tách code sau
