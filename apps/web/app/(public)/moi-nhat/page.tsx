import type { Metadata } from "next";
import { fetchLatestArticles } from "../../../lib/content/articles";

/**
 * Mới nhất (PLAN public route /moi-nhat/) — feed toàn bài published,
 * mới nhất trước, từ GET /articles.
 */
export const metadata: Metadata = {
  title: "Mới nhất | MStudio Channel",
  description: "Tin mới nhất từ MStudio Channel — cập nhật từ pipeline biên tập.",
};

export default async function LatestPage() {
  const articles = await fetchLatestArticles(20);

  return (
    <main className="home-main" id="main-content">
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>Mới nhất</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        {articles.length > 0
          ? `${articles.length} bài xuất bản — mới nhất trước.`
          : "Feed toàn bộ bài đã xuất bản."}
      </p>

      <section aria-labelledby="latest-feed-heading">
        <h2 id="latest-feed-heading">Feed mới nhất</h2>
        {articles.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa có bài xuất bản — quay lại sau.
          </p>
        ) : (
          <ul className="rec-list">
            {articles.map((article) => (
              <li key={article.id} className="rec-card">
                <p style={{ margin: "0 0 4px" }}>
                  <a href={`/bai-viet/${article.id}`}>{article.title}</a>
                </p>
                {article.summary ? (
                  <p style={{ color: "var(--gray)", margin: 0 }}>{article.summary}</p>
                ) : null}
                <p style={{ color: "var(--gray)", fontSize: "var(--text-sm)", margin: "6px 0 0" }}>
                  <time dateTime={article.updatedAt}>
                    {article.updatedAt.slice(0, 10)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
