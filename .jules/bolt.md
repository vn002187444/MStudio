## 2024-10-10 - Concurrency over independent queries

**Learning:** Cloudflare D1 efficiently supports concurrent independent queries using `Promise.all` with individual prepared statements (e.g. `.all()`), mitigating sequential query delays without hitting `.batch()` limits.
**Action:** When multiple independent queries form the basis of a recommendation algorithm or aggregate view, combine them via `Promise.all` rather than awaiting sequentially.
