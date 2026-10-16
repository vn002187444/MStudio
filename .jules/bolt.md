## 2024-05-14 - Optimize Cloudflare D1 Queries
**Learning:** Cloudflare D1 queries executed sequentially (using `await` on each `.first()` or `.all()` call) can be optimized by batching them with `db.batch()` which sends multiple SQL statements in a single HTTP request to the D1 database, reducing latency.
**Action:** Use `Promise.all()` (or `db.batch()`) for independent D1 read queries in the same route.

## 2026-10-16 - Cache Expensive Analytics Queries
**Learning:** Analytics queries that count entire tables (like `reader_events`) become very slow as data grows and don't need real-time precision.
**Action:** Use KV caching with `expirationTtl` to cache expensive aggregation queries and reduce D1 read load.