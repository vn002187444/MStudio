import type { Metadata } from "next";
import { fetchTrendingArticles } from "../../../lib/content/articles";

/**
 * Đang nóng (PLAN public route /dang-nong/) — ranking theo reader events
 * thật (pool trending của GET /recommendations). Không có event = trống,
 * không fabricate số liệu.
 */
export const metadata: Metadata = {
  title: "Đang nóng | MStudio Channel",
  description: "Bài đang được đọc nhiều trên MStudio Channel — xếp hạng theo tương tác thật.",
};

export default async function TrendingPage() {
  const articles = await fetchTrendingArticles(8);

  return (
    <main className="home-main" id="main-content">
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>Đang nóng</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        Xếp hạng theo lượt đọc thực tế trong thời gian gần — không dùng số liệu mô phỏng.
      </p>

      <section aria-labelledby="trending-feed-heading">
        <h2 id="trending-feed-heading">Được đọc nhiều</h2>
        {articles.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa đủ tín hiệu đọc để xếp hạng — xem{" "}
            <a href="/moi-nhat/">Mới nhất</a> nhé.
          </p>
        ) : (
          <ol className="rec-list">
            {articles.map((article, index) => (
              <li key={article.id} className="rec-card">
                <p style={{ margin: "0 0 4px" }}>
                  <span className="rec-pool" aria-hidden="true">
                    #{index + 1}
                  </span>{" "}
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
          </ol>
        )}
      </section>
    </main>
  );
}
