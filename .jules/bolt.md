## 2026-10-24 - [Subrequest Limit Exhaustion via Promise.all]
**Learning:** In Cloudflare Workers, firing multiple independent queries concurrently (e.g. using `Promise.all([db.prepare().all(), db.prepare().all()])`) executes N independent HTTP subrequests to D1. This quickly exhausts the strict 50 subrequests limit per invocation on the free tier.
**Action:** Always refactor concurrent independent queries into batched requests using `db.batch(statements)` within a unified database repository method.
