# FU-13 Deploy runbook — MStudio Channel (Cloudflare)

> Đối tượng: người chạy deploy lần đầu. Yêu cầu: `wrangler login` sẵn
> (xem FU-14). Không commit secret.

## 0. Chuẩn bị
- `node >= 24`, `pnpm >= 12`, `wrangler 4.x` (repo pin `4.148.0`).
- `pnpm install`, rồi verify: `pnpm -r typecheck`, `pnpm -r test`, `pnpm -r build`.

## 1. Tạo tài nguyên Cloudflare (1 lần duy nhất)
```bash
# D1 (thay database_id placeholder trong mọi wrangler.jsonc)
wrangler d1 create mstudio_dev
# → chép database_id vào 6 file workers/*/wrangler.jsonc (binding DB)

# Queues
wrangler queues create mstudio-events
wrangler queues create mstudio-normalize

# R2
wrangler r2 bucket create mstudio-raw
```

## 2. Apply migrations D1 (0001–0006, theo thứ tự)
```bash
for f in packages/db/migrations/*.sql; do
  wrangler d1 execute mstudio_dev --remote --file "$f"
done
# Verify: wrangler d1 execute mstudio_dev --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## 3. Deploy workers (thứ tự: ingest → normalize → intelligence → analytics → api → publish)
```bash
for w in ingest normalize intelligence analytics api publish; do
  pnpm --dir workers/$w exec wrangler deploy
done
```
Lưu ý config hiện tại:
- `ENVIRONMENT`/`LOG_LEVEL` mặc định production cho ingest/normalize/intelligence/analytics.
- `publish` còn `SITE_URL=https://mstudio.minds.io.vn` placeholder → sửa trước khi deploy thật.
- `api` dùng var `READER_EVENT_SAMPLING_RATE=0.05`.
- Cron: ingest `*/5`, intelligence `*/15` — cân nhắc tắt cron ingest lần deploy đầu nếu chưa có feed thật.

## 4. Verify sau deploy
```bash
curl https://<api-url>/healthz                      # expect 200
curl -X POST https://<api-url>/events -d '{...}'    # expect 202
curl "https://<api-url>/recommendations?..."        # expect 200
curl https://<api-url>/articles/<id>               # bài published → 200 + title/summary
```
Tail log: `wrangler tail mstudio-api`, `wrangler tail mstudio-analytics`.

## 5. Rollback
- Workers: `wrangler rollback mstudio-<name>` (giữ 2 bản gần nhất trước khi deploy).
- D1: migrations chỉ tiến (không có down) — sự cố schema thì fix-forward bằng migration mới, không sửa file cũ.
- Queue backlog: `wrangler queues ...` kiểm tra depth trước khi redeploy consumer.
