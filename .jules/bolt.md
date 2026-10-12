## 2024-10-12 - D1 db.batch chunking limit
**Learning:** Cloudflare D1 has a hard limit of 100 statements per `db.batch()` call. If we pass more than 100 statements, it will throw an error and fail.
**Action:** Always chunk arrays into batches of max 100 before calling `db.batch()`. For example `createReaderEvents` needs to be fixed to chunk its batch operations just like `createRawItems` does.
