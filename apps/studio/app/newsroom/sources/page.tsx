import {
  apiBaseUrl,
  formatTime,
  type FeedRow,
  type SourceRow,
} from "../../../lib/cms";

/**
 * Sources — nguồn + feeds crawl (CMS quản trị nguồn).
 * Public list endpoints, server-render. Thay đổi (thêm/sửa allow-status)
 * yêu cầu admin — làm ở task tiếp theo cùng login CMS.
 */
const FETCH_OPTIONS = { next: { revalidate: 60 } } as const;

async function fetchSources(): Promise<SourceRow[]> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/sources?limit=100`,
      FETCH_OPTIONS,
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as { rows?: SourceRow[] };
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

async function fetchFeeds(sourceId: string): Promise<FeedRow[]> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/sources/${sourceId}/feeds`,
      FETCH_OPTIONS,
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      rows?: FeedRow[];
      feeds?: FeedRow[];
    };
    const rows = payload.rows ?? payload.feeds ?? [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export default async function SourcesPage() {
  const sources = await fetchSources();
  const feedsBySource = new Map<string, FeedRow[]>();
  await Promise.all(
    sources.map(async (source) => {
      feedsBySource.set(source.id, await fetchFeeds(source.id));
    }),
  );

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Sources</h1>
      {sources.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>
          Chưa có nguồn nào — kiểm tra API sources.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--gray)", margin: "0 0 20px" }}>
            Hệ thống đang tích hợp {sources.length} nguồn crawl tin tức tự động (VnExpress, Tuổi Trẻ, Thanh Niên, Zing, Reuters, BBC, TechCrunch...).
          </p>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {sources.map((source) => (
              <section
                aria-labelledby={`source-${source.id}`}
                key={source.id}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <h2
                    id={`source-${source.id}`}
                    style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--ink)" }}
                  >
                    {source.name}
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: source.allowStatus === "allowed" ? "#dcfce7" : "#fee2e2",
                      color: source.allowStatus === "allowed" ? "#15803d" : "#b91c1c",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {source.allowStatus}
                  </span>
                </div>
                <p style={{ color: "var(--gray)", fontSize: "12.5px", margin: "0 0 12px", wordBreak: "break-all" }}>
                  <a href={source.originUrl} rel="noreferrer" target="_blank" style={{ color: "var(--ai-blue)", textDecoration: "none" }}>
                    {source.originUrl}
                  </a>
                  {" · "}{source.kind}
                </p>
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
                    Luồng RSS ({feedsBySource.get(source.id)?.length ?? 0}):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: "12px", color: "var(--gray)", display: "flex", flexDirection: "column", gap: 4 }}>
                    {(feedsBySource.get(source.id) ?? []).map((feed) => (
                      <li key={feed.id} style={{ wordBreak: "break-all" }}>
                        <span style={{ color: "var(--ink)" }}>{feed.url}</span>
                        {" "}
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: feed.enabled ? "#f0fdf4" : "#f1f5f9",
                            color: feed.enabled ? "#16a34a" : "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          {feed.format} · {feed.enabled ? "BẬT" : "TẮT"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
