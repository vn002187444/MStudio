## 2024-05-14 - Optimize Cloudflare D1 Queries
**Learning:** Cloudflare D1 queries executed sequentially (using `await` on each `.first()` or `.all()` call) can be optimized by batching them with `db.batch()` which sends multiple SQL statements in a single HTTP request to the D1 database, reducing latency.
**Action:** Use `db.batch()` or `Promise.all()` for independent D1 read queries in the same route.
