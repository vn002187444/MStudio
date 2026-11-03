import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createD1Adapter } from "./d1-adapter.js";
import worker from "./worker.js";

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

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || "api-mstudio.minds.io.vn";
    const url = new URL(req.url, `https://${host}`);
    const method = req.method;

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
});
