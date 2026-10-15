/**
 * Incoming — danh sách RawItem thật từ GET /raw-items (MST-009).
 * Contract đóng băng: RawItemListResponse = PagedRows<RawItemRecord>, keyset
 * cursor (created_at, id). Types dưới đây mirror packages/contracts (TODO:
 * import trực tiếp khi MST-002 wire workspace dep cho apps/studio).
 */
import { AcceptRejectButtons, TokenGate } from "../../../components/cms-actions";
import { apiBaseUrl } from "../../../lib/cms";
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

  let incoming: RawItemListResponse = { rows: [] };
  let sources: SourceListResponse = { rows: [] };
  let fetchError: string | undefined = undefined;

  try {
    const [incomingRes, sourcesRes] = await Promise.all([
      fetchJson<RawItemListResponse>(`/raw-items?${incomingQuery.toString()}`),
      fetchJson<SourceListResponse>("/sources?limit=100"),
    ]);
    incoming = incomingRes;
    sources = sourcesRes;
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Lỗi khi nạp dữ liệu từ backend";
  }

  const sourceNames = new Map(sources.rows.map((source) => [source.id, source.name]));

  if (fetchError) {
    return (
      <main>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Incoming</h1>
        <div role="alert" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24 }}>
          <h2 style={{ fontSize: "var(--text-base)", margin: "0 0 4px", color: "var(--breaking-red)" }}>
            Đang đồng bộ luồng Ingestion…
          </h2>
          <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
            {fetchError}. Hệ thống đang kết nối với Cloudflare Worker Ingest. Vui lòng bấm thử lại bên dưới.
          </p>
          <a className="btn-primary" href="/newsroom/incoming" style={{ textDecoration: "none", display: "inline-block" }}>
            Nạp lại dữ liệu
          </a>
        </div>
      </main>
    );
  }

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
      <TokenGate>
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <table className="responsive-table" style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--gray)", fontSize: "13px" }}>
              Tin incoming đang chờ duyệt hoặc gom cụm xử lý
            </caption>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Tiêu đề</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Nguồn</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Thời gian</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {incoming.rows.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", maxWidth: 360 }}>
                    <a
                      href={item.canonicalUrl ?? item.url}
                      rel="noreferrer"
                      target="_blank"
                      style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}
                    >
                      {item.title ?? item.url}
                    </a>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {sourceNames.get(item.sourceId) ?? item.sourceId.slice(0, 8)}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--gray)" }}>
                    {formatTime(item.publishedAt ?? item.fetchedAt)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <AcceptRejectButtons rawItemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TokenGate>
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
