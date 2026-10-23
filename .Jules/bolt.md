## 2024-05-14 - Optimize Cloudflare D1 Queries
**Learning:** Cloudflare D1 queries executed sequentially (using `await` on each `.first()` or `.all()` call) can be optimized by batching them with `db.batch()` which sends multiple SQL statements in a single HTTP request to the D1 database, reducing latency.
**Action:** Use `Promise.all()` (or `db.batch()`) for independent D1 read queries in the same route.

## 2026-10-16 - Cache Expensive Analytics Queries
**Learning:** Analytics queries that count entire tables (like `reader_events`) become very slow as data grows and don't need real-time precision.
**Action:** Use KV caching with `expirationTtl` to cache expensive aggregation queries and reduce D1 read load.

## 2026-10-21 - Batching Independent D1 Reads
**Learning:** Cloudflare D1 supports `.batch()` to execute multiple read queries in a single roundtrip to the database, which is far more efficient than `Promise.all([db.prepare().all(), ...])`. In unit tests, the custom test adapter for `db.batch()` was simulating `.run()` calls which didn't populate the `results` array, causing test failures. D1's `.batch()` inherently acts like `.all()` across all batched statements and populates `.results`.
**Action:** When making multiple independent `SELECT` queries (e.g. for diverse recommendation pools), use `db.batch()` instead of `Promise.all` to reduce Cloudflare Workers subrequests. Remember to unpack `results[i].results` with a fallback `?? []` as necessary when mocking or extracting datasets.

## 2026-10-21 - Batch D1 Count Queries
**Learning:** Even when run inside `Promise.all()`, multiple independent `.first()` or `.all()` Cloudflare D1 query calls over HTTP from the Worker generate separate subrequests and incur multiple round-trip network latencies, which counts against the 50 subrequests Free Tier quota.
**Action:** Unroll `Promise.all` containing D1 queries into a single `db.batch()` call to consolidate into a single HTTP roundtrip and reduce subrequest usage.

## 2024-05-20 - Batch Independent API Subrequests
**Learning:** Resolving multiple recommendation candidates from the frontend using `Promise.all` and multiple `fetchArticleById` calls generates N+1 independent HTTP subrequests to the Cloudflare Worker API. This incurs significant network latency and exhausts Free Tier subrequest quotas.
**Action:** Update the `/articles` endpoint to support an `ids` query parameter and use a single batched fetch from the frontend to retrieve all candidate articles in one roundtrip.
