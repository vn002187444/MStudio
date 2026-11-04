import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createD1Adapter } from "./d1-adapter.js";
import worker from "./worker.js";
import { runIngest } from "./ingest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "data", "mstudio.db");

const sqlite = new DatabaseSync(dbPath);
const d1 = createD1Adapter(sqlite);

const env = {
  DB: d1,
  ENVIRONMENT: "production",
  LOG_LEVEL: "info",
  QUOTA_MODE: "SAFE",
  READER_EVENT_SAMPLING_RATE: "0.05",
  RAW_BUCKET: null,
  EVENTS_QUEUE: null,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

// 🛑 Abusive scraper bots to block instantly (0.01ms CPU)
const BLOCKED_BOT_REGEX = /Reflectionbot|Bytespider|PetalBot|Amazonbot/i;
// 🟢 Legitimate AI Search & SEO Indexers to welcome
const ALLOWED_AI_SEARCH_BOT_REGEX = /GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot|Applebot|Googlebot|Bingbot/i;

const server = http.createServer(async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"] || "";

    // 🛑 Chặn đứng abusive scrapers ngay từ cổng HTTP server (0.01ms CPU, trước SQLite/Worker)
    if (BLOCKED_BOT_REGEX.test(userAgent)) {
      res.writeHead(403, {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
        "Connection": "close",
      });
      res.end("Access Forbidden: Aggressive scraper bot blocked.");
      return;
    }

    const host = req.headers.host || "api-mstudio.minds.io.vn";
    const url = new URL(req.url, `https://${host}`);
    const method = req.method;

    // Admin Ingest Endpoint for on-demand trigger or webhook
    if (url.pathname === "/api/admin/ingest" && (method === "POST" || method === "GET")) {
      const authHeader = req.headers.authorization || url.searchParams.get("token") || "";
      const expectedToken = process.env.ADMIN_TOKEN || "mstudio_ingest_secret_2026";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      if (token !== expectedToken) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or missing Bearer token" }));
        return;
      }

      const maxFeeds = Number(url.searchParams.get("maxFeeds")) || 25;
      const summary = await runIngest({ maxFeeds });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, summary }));
      return;
    }

    // Admin Delta Endpoint for daily D1 sync
    if (url.pathname === "/api/admin/delta" && method === "GET") {
      const authHeader = req.headers.authorization || url.searchParams.get("token") || "";
      const expectedToken = process.env.ADMIN_TOKEN || "mstudio_ingest_secret_2026";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      if (token !== expectedToken) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or missing Bearer token" }));
        return;
      }

      const since = url.searchParams.get("since") || "1970-01-01T00:00:00.000Z";
      const limit = Math.min(Number(url.searchParams.get("limit")) || 300, 1000);

      const articles = sqlite.prepare(
        "SELECT * FROM articles WHERE created_at > ? ORDER BY created_at ASC LIMIT ?"
      ).all(since, limit);

      const articleIds = articles.map((a) => a.id);
      const storyIds = [...new Set(articles.map((a) => a.story_id).filter(Boolean))];

      let stories = [];
      if (storyIds.length > 0) {
        const placeholders = storyIds.map(() => "?").join(",");
        stories = sqlite.prepare(`SELECT * FROM stories WHERE id IN (${placeholders})`).all(...storyIds);
      }

      let revisions = [];
      if (articleIds.length > 0) {
        const placeholders = articleIds.map(() => "?").join(",");
        revisions = sqlite.prepare(`SELECT * FROM article_revisions WHERE article_id IN (${placeholders})`).all(...articleIds);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        since,
        count: articles.length,
        articles,
        stories,
        revisions
      }));
      return;
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        for (const item of v) headers.append(k, item);
      } else if (v !== undefined) {
        headers.set(k, v);
      }
    }

    let body = undefined;
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks);
    }

    const webReq = new Request(url, { method, headers, body });
    const webRes = await worker.fetch(webReq, env, { waitUntil: () => {} });

    const resHeaders = Object.fromEntries(webRes.headers.entries());
    if (ALLOWED_AI_SEARCH_BOT_REGEX.test(userAgent)) {
      resHeaders["x-ai-bot-status"] = "allowed-indexer";
    }
    res.writeHead(webRes.status, resHeaders);
    const resBuffer = await webRes.arrayBuffer();
    res.end(Buffer.from(resBuffer));
  } catch (err) {
    console.error("[MStudio API Error]:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "INTERNAL_ERROR", message: String(err) }));
  }
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  console.log(`[MStudio API] Listening on port ${port} (Node 24 + SQLite at ${dbPath})`);

  // Autonomous background ingest while server process is active
  if (process.env.AUTO_INGEST !== "false") {
    const INGEST_INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS) || (30 * 60 * 1000); // 30 minutes
    console.log(`[MStudio Ingest] Self-scheduled background ingest enabled (interval: ${INGEST_INTERVAL_MS / 1000}s)`);

    // Initial background run 30s after startup
    setTimeout(() => {
      console.log("[MStudio Ingest] Running initial background feed scan...");
      runIngest({ maxFeeds: 15 }).catch((err) => console.error("[Auto-Ingest Startup Error]:", err));
    }, 30_000);

    // Periodic interval
    setInterval(() => {
      console.log("[MStudio Ingest] Running scheduled periodic feed scan...");
      runIngest({ maxFeeds: 25 }).catch((err) => console.error("[Auto-Ingest Interval Error]:", err));
    }, INGEST_INTERVAL_MS);
  }
});
