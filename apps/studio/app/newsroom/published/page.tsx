import {
  apiBaseUrl,
  formatTime,
  webBaseUrl,
  type ArticleRow,
} from "../../../lib/cms";

/**
 * Published — bài đã xuất bản, mới nhất trước (CMS theo dõi output).
 * Public endpoint, server-render + revalidate 60s.
 */
const FETCH_OPTIONS = { next: { revalidate: 60 } } as const;

async function fetchPublished(): Promise<ArticleRow[]> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/articles?limit=50`,
      FETCH_OPTIONS,
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as { rows?: ArticleRow[] };
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

export default async function PublishedPage() {
  const articles = await fetchPublished();

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Published</h1>
      {articles.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>
          Chưa có bài published nào — duyệt ở Incoming rồi publish tại Needs Review.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
            {articles.length} bài đang live.
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption style={{ textAlign: "left" }}>Bài đã xuất bản</caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left" }}>ID</th>
                <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <a
                      href={`${webBaseUrl()}/bai-viet/${article.id}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {article.id.slice(0, 8)}…
                    </a>
                  </td>
                  <td>{article.status}</td>
                  <td>{formatTime(article.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
