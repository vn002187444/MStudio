
## 2024-10-21 - Batch D1 Count Queries
**Learning:** Even when run inside `Promise.all()`, multiple independent `.first()` or `.all()` Cloudflare D1 query calls over HTTP from the Worker generate separate subrequests and incur multiple round-trip network latencies, which counts against the 50 subrequests Free Tier quota.
**Action:** Unroll `Promise.all` containing D1 queries into a single `db.batch()` call to consolidate into a single HTTP roundtrip and reduce subrequest usage.
