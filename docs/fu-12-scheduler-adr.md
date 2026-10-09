# FU-12 ADR: Scheduler loop — giữ tuần tự hay concurrent?

> Đo ngày 09-10-2026 trên `workers/ingest` (migrated test DB, mock fetch 30ms,
> 24 feeds). Không đổi production code. Human quyết.

## Kết quả benchmark
| Variant | Wall (24 feeds) | Max in-flight | Tallies (fail-case) |
|---|---|---|---|
| Sequential (main hiện tại) | ~1160ms | 1 | feeds 12, enq 1, dup 9, failed 2 |
| `Promise.all` (nhánh MST-007) | ~84ms | 24 | giống hệt |
| `Promise.allSettled` (nhánh MST-123) | ~60ms | 24 | giống hệt |

- Tallies **đồng nhất cả 3** ở happy-path và failure-path (2 feeds lỗi).
  Cả 3 đều try/catch từng feed nên không có fail-fast.
- Concurrent nhanh hơn **~15–20x** ở latency 30ms/feed; chênh lệch càng lớn
  khi feed chậm (timeout mặc định 10s).

## Rủi ro của concurrent
- Burst tối đa `pageSize` (mặc định 100) outbound fetch + D1 writes cùng lúc mỗi page.
- Free-tier: nằm trong giới hạn subrequest/cron, nhưng 100 fetch đồng thời
  tới các nguồn nhỏ có thể bị rate-limit phía họ → failed tăng giả tạo.

## Đề xuất (chờ Human chọn 1)
- **A (khuyên dùng)**: merge biến thể `allSettled`, giữ nguyên `pageSize: 100`.
  Lý do: failure isolation rõ ràng nhất về ngữ nghĩa; tallies đã chứng minh tương đương.
- **B (thận trọng)**: giữ tuần tự, thêm option `maxConcurrency` + batch bounded
  (vd 10) — tốn thêm 1 task implement.
- **C**: giữ nguyên hiện tại, đóng cả 2 nhánh.

## Disposition các nhánh
- Bench file của MST-007 đã lấy vào main (commit `d119109`).
- `feat/MST-007-jules-perf-*` và `feat/MST-123-jules-optimize-scheduler-*`
  giữ mở làm tham chiếu tới khi ADR này được duyệt; duyệt xong đóng nhánh thua.
