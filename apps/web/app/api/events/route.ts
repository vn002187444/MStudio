/**
 * Same-origin proxy cho reader events (MST-062).
 * Lý do: tránh CORS browser→workers/api, giữ API base URL phía server.
 * Chỉ forward eventType trong allowlist PLAN (follow/hide/share/save/...).
 */
import { apiBaseUrl, fetchApi } from "../../../lib/api";
const ALLOWED_EVENT_TYPES = new Set([
  "open_article",
  "meaningful_read",
  "follow_topic",
  "hide_topic",
  "share",
  "save",
]);

interface IncomingEvent {
  eventType?: unknown;
  topicId?: unknown;
  articleId?: unknown;
  url?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return Response.json({ error: { code: "INVALID_JSON", message: "invalid JSON" } }, { status: 400 });
  }
  const events = (Array.isArray(body) ? body : [body]) as IncomingEvent[];
  for (const event of events) {
    if (typeof event !== "object" || event === null || !ALLOWED_EVENT_TYPES.has(event.eventType as string)) {
      return Response.json(
        { error: { code: "VALIDATION_FAILED", message: "unsupported eventType" } },
        { status: 400 },
      );
    }
  }
  const upstream = await fetchApi(`/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(events),
  });
  const payload = (await upstream.json().catch(() => ({}))) as unknown;
  return Response.json(payload, { status: upstream.status });
}
