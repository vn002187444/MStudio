import type { Metadata } from "next";
import { fetchLatestArticles } from "../../../lib/content/articles";
import { CompactNewsCard, LeadStoryCard } from "../../../components/article/news-card";

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
  const [heroArticle, ...restArticles] = articles;

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
      {/* Category Header */}
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
          <span style={{ color: "var(--gray)", fontSize: "13px" }}>Dòng sự kiện</span>
          <span style={{ color: "var(--gray)", fontSize: "12px" }}>/</span>
          <span style={{ color: "var(--accent, #2563eb)", fontSize: "13px", fontWeight: 600 }}>Mới nhất</span>
        </div>
        <h1 style={{ fontSize: "var(--text-4xl, 36px)", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2, display: "flex", alignItems: "center", gap: 12 }}>
          Dòng tin mới nhất
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--ai-blue, #2563EB)",
              background: "var(--blue-50, #EFF6FF)",
              padding: "4px 10px",
              borderRadius: 9999,
              border: "1px solid var(--blue-200, #BFDBFE)",
            }}
          >
            <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: "currentColor", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
            Cập nhật liên tục 24/7
          </span>
        </h1>
        <p style={{ color: "var(--ink-700, #4b5563)", fontSize: "var(--text-base, 16px)", margin: 0, maxWidth: 720 }}>
          {articles.length > 0
            ? `Hiển thị ${articles.length} bài viết mới nhất được xuất bản bởi ban biên tập.`
            : "Chưa có bài viết mới."}
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
          {/* Main Column (8 Columns) */}
          <div style={{ gridColumn: "span 12" }} className="lg-col-8">
            {heroArticle ? (
              <div style={{ marginBottom: 32 }}>
                <LeadStoryCard article={heroArticle} />
              </div>
            ) : null}

            {restArticles.length > 0 ? (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: 16 }}>
                  Dòng thời gian
                </h2>
                {restArticles.map((article) => (
                  <CompactNewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Sidebar Column (4 Columns) */}
          <aside
            aria-label="Sidebar chuyên mục"
            style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 24 }}
            className="lg-col-4"
          >
            <section
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>
                Chuyên mục tiêu điểm
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "Công nghệ", href: "/cong-nghe" },
                  { label: "Kinh doanh", href: "/kinh-doanh" },
                  { label: "Thời sự", href: "/thoi-su" },
                  { label: "AI Channel", href: "/ai-channel" },
                ].map((cat) => (
                  <a
                    key={cat.href}
                    href={cat.href}
                    style={{
                      background: "var(--soft, #f8fafc)",
                      border: "1px solid var(--border)",
                      padding: "6px 12px",
                      borderRadius: 16,
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "var(--ink-700, #374151)",
                      textDecoration: "none",
                    }}
                  >
                    {cat.label}
                  </a>
                ))}
              </div>
            </section>

            <section
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                🔥 Đang nóng
              </h3>
              <p style={{ fontSize: "13px", color: "var(--ink-700, #4b5563)", margin: 0 }}>
                Các bài viết đang thu hút nhiều sự quan tâm nhất hiện nay.
              </p>
              <a href="/dang-nong" style={{ fontSize: "13px", fontWeight: 600, color: "var(--ai-blue)", textDecoration: "none", marginTop: 4 }}>
                Xem danh sách xếp hạng →
              </a>
            </section>

            <section
              style={{
                background: "var(--soft, #f8fafc)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px" }}>
                Đăng ký nhận tin
              </h3>
              <p style={{ fontSize: "13px", color: "var(--ink-700, #4b5563)", lineHeight: 1.5, margin: "0 0 12px" }}>
                Nhận bản tin tóm tắt những sự kiện nổi bật nhất mỗi ngày trực tiếp qua email.
              </p>
              <form style={{ display: "flex", gap: 8 }}>
                <input 
                  type="email" 
                  placeholder="Email của bạn..." 
                  aria-label="Địa chỉ email"
                  required
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--ink)",
                    color: "var(--white)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Đăng ký
                </button>
              </form>
            </section>
          </aside>
        </div>
      ) : (
        <section aria-labelledby="empty-state-heading" style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <h2 id="empty-state-heading" className="visually-hidden">Chưa có bài viết</h2>
          <p style={{ color: "var(--gray)", margin: 0 }}>Chưa có bài xuất bản — vui lòng quay lại sau.</p>
        </section>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @media (min-width: 992px) {
          .lg-col-8 {
            grid-column: span 8 !important;
          }
          .lg-col-4 {
            grid-column: span 4 !important;
          }
        }
      `}</style>
    </main>
  );
}
