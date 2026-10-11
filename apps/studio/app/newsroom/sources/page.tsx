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
          <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
            {sources.length} nguồn crawl.
          </p>
          {sources.map((source) => (
            <section
              aria-labelledby={`source-${source.id}`}
              key={source.id}
              style={{ marginBottom: 24 }}
            >
              <h2
                id={`source-${source.id}`}
                style={{ fontSize: "var(--text-xl)", margin: "0 0 4px" }}
              >
                {source.name}
              </h2>
              <p style={{ color: "var(--gray)", margin: "0 0 8px" }}>
                {source.originUrl} · {source.kind} · allow: {source.allowStatus}
              </p>
              <ul>
                {(feedsBySource.get(source.id) ?? []).map((feed) => (
                  <li key={feed.id}>
                    {feed.url} ({feed.format}
                    {feed.enabled ? ", đang bật" : ", đã tắt"})
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
