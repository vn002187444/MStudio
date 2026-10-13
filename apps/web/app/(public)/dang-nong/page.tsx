import type { Metadata } from "next";
import { fetchTrendingArticles } from "../../../lib/content/articles";
import { CompactNewsCard, LeadStoryCard } from "../../../components/article/news-card";

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
  const [topArticle, ...restArticles] = articles;

  return (
    <main
      className="home-main"
      id="main-content"
      style={{
        maxWidth: "var(--max-content-width, 1280px)",
        margin: "0 auto",
        padding: "24px 16px 64px",
      }}
    >
      {/* Page Header */}
      <header
        style={{
          borderBottom: "2px solid var(--ink, #111827)",
          paddingBottom: 16,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <a href="/" style={{ color: "var(--gray)", fontSize: "13px", textDecoration: "none" }}>Trang chủ</a>
          <span style={{ color: "var(--gray)", fontSize: "12px" }}>/</span>
          <span style={{ color: "var(--accent, #2563eb)", fontSize: "13px", fontWeight: 600 }}>Đang nóng</span>
        </div>
        <h1 style={{ fontSize: "var(--text-4xl, 36px)", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 12 }}>
          Tin tức đang nóng 🔥
        </h1>
        <p style={{ color: "var(--ink-700, #4b5563)", fontSize: "var(--text-base, 16px)", margin: 0, maxWidth: 720, background: "var(--soft, #f8fafc)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", display: "inline-block" }}>
          Xếp hạng dựa trên tín hiệu tương tác và lượt đọc thực tế của độc giả — minh bạch và không dùng số liệu mô phỏng.
        </p>
      </header>

      {articles.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 32,
          }}
        >
          {/* Main Content Area */}
          <div style={{ gridColumn: "span 12", maxWidth: 800, margin: "0 auto", width: "100%" }}>
            
            {/* #1 Top Article */}
            {topArticle ? (
              <section aria-labelledby="top-1-heading" style={{ position: "relative", marginBottom: 32 }}>
                <h2 id="top-1-heading" className="visually-hidden">Bài viết Top 1</h2>
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    left: -16,
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--accent, #2563eb)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 800,
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                    border: "4px solid var(--off-white, #fdfdfd)"
                  }}
                  aria-hidden="true"
                >
                  1
                </div>
                <LeadStoryCard article={topArticle} />
              </section>
            ) : null}

            {/* #2 - #8 Articles */}
            {restArticles.length > 0 ? (
              <section aria-labelledby="trending-rest-heading">
                <h2 id="trending-rest-heading" style={{ fontSize: "18px", fontWeight: 700, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                  Top được đọc nhiều tiếp theo
                </h2>
                <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                  {restArticles.map((article, index) => {
                    const rank = index + 2; // offset by 1 for #1, then 1-based index
                    return (
                      <li 
                        key={article.id} 
                        style={{ 
                          position: "relative", 
                          background: "var(--white)", 
                          borderRadius: "var(--radius-lg, 16px)", 
                          border: "1px solid var(--border)", 
                          padding: "16px",
                          paddingLeft: "64px" // Make room for rank
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: 16,
                            transform: "translateY(-50%)",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: rank <= 3 ? "var(--ink)" : "var(--soft, #f8fafc)",
                            color: rank <= 3 ? "white" : "var(--gray)",
                            border: rank <= 3 ? "none" : "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: 700,
                          }}
                          aria-hidden="true"
                        >
                          {rank}
                        </div>
                        <CompactNewsCard article={article} />
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}

          </div>
        </div>
      ) : (
        <section aria-labelledby="empty-state-heading" style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <h2 id="empty-state-heading" className="visually-hidden">Chưa có bài viết</h2>
          <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
            Chưa đủ tín hiệu đọc để xếp hạng.
          </p>
          <a
            href="/moi-nhat"
            style={{
              display: "inline-block",
              background: "var(--ink)",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Xem tin mới nhất
          </a>
        </section>
      )}
    </main>
  );
}
