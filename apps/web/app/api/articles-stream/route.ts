import { fetchApi } from "../../../lib/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") || "12";
  const cursorCreatedAt = url.searchParams.get("cursorCreatedAt");
  const cursorId = url.searchParams.get("cursorId");
  const category = url.searchParams.get("category");

  let upstreamQuery = `/articles?limit=${limit}`;
  if (category) {
    upstreamQuery += `&category=${encodeURIComponent(category)}`;
  }
  if (cursorCreatedAt && cursorId) {
    upstreamQuery += `&cursorCreatedAt=${encodeURIComponent(cursorCreatedAt)}&cursorId=${encodeURIComponent(cursorId)}`;
  }

  try {
    const res = await fetchApi(upstreamQuery, { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ rows: [], nextCursor: undefined }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ rows: [], nextCursor: undefined }, { status: 500 });
  }
}
