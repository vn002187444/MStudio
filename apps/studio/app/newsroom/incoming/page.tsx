/**
 * Incoming — danh sách RawItem thật từ GET /raw-items (MST-009).
 * Contract đóng băng: RawItemListResponse = PagedRows<RawItemRecord>, keyset
 * cursor (created_at, id). Types dưới đây mirror packages/contracts (TODO:
 * import trực tiếp khi MST-002 wire workspace dep cho apps/studio).
 */
interface KeysetCursor {
  createdAt: string;
  id: string;
}

interface RawItemRow {
  id: string;
  feedId: string;
  sourceId: string;
  url: string;
  canonicalUrl?: string;
  title?: string;
  publishedAt?: string;
  fetchedAt: string;
  status: string;
  createdAt: string;
}

interface RawItemListResponse {
  rows: RawItemRow[];
  nextCursor?: KeysetCursor;
}

interface SourceRow {
  id: string;
  name: string;
}

interface SourceListResponse {
  rows: SourceRow[];
}

const PAGE_LIMIT = 20;

// Inbox CMS cần dữ liệu tươi — no-store có chủ đích (khác reader surfaces cache-first).
const FETCH_OPTIONS = { cache: "no-store" } as const;

function apiBaseUrl(): string {
  return process.env.MSTUDIO_API_URL ?? "http://localhost:8787";
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, FETCH_OPTIONS);
  if (!response.ok) {
    throw new Error(`API ${response.status} cho ${path}`);
  }
  return (await response.json()) as T;
}

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatTime(iso?: string): string {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "—";
  return dateTimeFormat.format(new Date(iso));
}

function nextPageHref(cursor: KeysetCursor): string {
  const params = new URLSearchParams({
    cursor_created_at: cursor.createdAt,
    cursor_id: cursor.id,
  });
  return `/newsroom/incoming?${params.toString()}`;
}

export default async function IncomingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const cursorCreatedAt = params.cursor_created_at;
  const cursorId = params.cursor_id;
  const hasCursor = Boolean(cursorCreatedAt && cursorId);

  const incomingQuery = new URLSearchParams({
    status: "incoming",
    limit: String(PAGE_LIMIT),
  });
  if (hasCursor) {
    incomingQuery.set("cursor_created_at", cursorCreatedAt as string);
    incomingQuery.set("cursor_id", cursorId as string);
  }

  const [incoming, sources] = await Promise.all([
    fetchJson<RawItemListResponse>(`/raw-items?${incomingQuery.toString()}`),
    fetchJson<SourceListResponse>("/sources?limit=100"),
  ]);
  const sourceNames = new Map(sources.rows.map((source) => [source.id, source.name]));

  if (incoming.rows.length === 0) {
    return (
      <main>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Incoming</h1>
        <div role="status" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24 }}>
          <h2 style={{ fontSize: "var(--text-base)", margin: "0 0 4px" }}>
            {hasCursor ? "Hết tin" : "Chưa có tin mới"}
          </h2>
          <p style={{ color: "var(--gray)", margin: hasCursor ? "0 0 16px" : 0 }}>
            {hasCursor ? (
              <a href="/newsroom/incoming">Quay lại trang đầu</a>
            ) : (
              "Hàng đợi ingestion chưa có RawItem nào — kiểm tra scheduler và feeds (MST-007)."
            )}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Incoming</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        {incoming.rows.length} tin — nguồn, thời gian và trạng thái bên dưới.
      </p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <caption style={{ textAlign: "left" }}>Tin incoming chờ xử lý</caption>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: "left" }}>Tiêu đề</th>
            <th scope="col" style={{ textAlign: "left" }}>Nguồn</th>
            <th scope="col" style={{ textAlign: "left" }}>Thời gian</th>
            <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {incoming.rows.map((item) => (
            <tr key={item.id}>
              <td>
                <a href={item.canonicalUrl ?? item.url} rel="noreferrer" target="_blank">
                  {item.title ?? item.url}
                </a>
              </td>
              <td>{sourceNames.get(item.sourceId) ?? item.sourceId.slice(0, 8)}</td>
              <td>{formatTime(item.publishedAt ?? item.fetchedAt)}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {incoming.nextCursor ? (
        <p style={{ marginTop: 16 }}>
          <a className="btn-primary" href={nextPageHref(incoming.nextCursor)} style={{ textDecoration: "none" }}>
            Xem thêm
          </a>
        </p>
      ) : (
        <p role="status" style={{ color: "var(--gray)" }}>Đã hiển thị hết tin incoming.</p>
      )}
    </main>
  );
}
