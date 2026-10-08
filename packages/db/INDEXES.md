# D1 v1 hot-query indexes (MST-004)

Owner: commandcode. Human gate: schema.

## Indexes

| Index | Table | Columns | Serves |
| --- | --- | --- | --- |
| `idx_raw_items_feed_fetched` | raw_items | (feed_id, fetched_at) | Paginated incoming list per feed (MST-009) |
| `idx_raw_items_status_created` | raw_items | (status, created_at) | Pipeline polling by status, keyset-paginated |
| `idx_raw_items_canonical` | raw_items | (canonical_url) partial | Canonical-URL dedupe candidates (MST-008) |
| `idx_raw_items_payload_hash` | raw_items | (payload_hash) | Payload-hash idempotency fallback (MST-008) |
| `idx_jobs_status_type` | jobs | (status, type) | Job queue polling by status + type |
| `idx_jobs_correlation_id` | jobs | (correlation_id) | Lineage lookup by correlation id (MST-011) |
| `UNIQUE (source_id, url)` | feeds | (source_id, url) | One feed per URL per source |
| `UNIQUE (feed_id, external_id)` | raw_items | (feed_id, external_id) | Ingest idempotency (MST-008) |

## Access patterns

- All list queries use keyset pagination on `(created_at, id)` — no `OFFSET`
  scans, so page N does not re-read rows 1..N-1.
- Every repository query selects explicit columns (no `SELECT *`) and is
  parameterized (no string interpolation) to prevent SQL injection.
- Writes: each `raw_items` insert pays 5 index writes. Acceptable for
  free-tier ingest volume; revisit if ingest rate grows (QuotaGuard tracks
  D1 writes).

## Foreign keys

`feeds.source_id`, `raw_items.feed_id`, `raw_items.source_id` are
`ON DELETE CASCADE` FKs. D1 enforces FKs by default; tests enable
`PRAGMA foreign_keys = ON` explicitly.
