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
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Tiêu đề bài viết</th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Chuyên mục</th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left", padding: "10px 12px" }}>Cập nhật</th>
                <th scope="col" style={{ textAlign: "center", padding: "10px 12px" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", maxWidth: 380 }}>
                    <a
                      href={`${webBaseUrl()}/bai-viet/${article.slug || article.id}`}
                      rel="noreferrer"
                      target="_blank"
                      style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}
                    >
                      {article.title || article.slug || `${article.id.slice(0, 8)}…`}
                    </a>
                    <br />
                    <span style={{ color: "var(--gray)", fontSize: "12px" }}>
                      ID: {article.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 500,
                      }}
                    >
                      {article.categorySlug || "Thời sự"}
                    </span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>
                      ● {article.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "var(--gray)" }}>
                    {formatTime(article.updatedAt)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <a
                      href={`/editor?article=${article.id}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0f172a",
                        textDecoration: "none",
                      }}
                    >
                      ✍️ Sửa bài
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
