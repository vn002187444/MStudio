import type { PublishedArticleRecord } from "@mstudio/contracts";
import { apiBaseUrl } from "../../lib/api";
import {
  CompactNewsCard,
  FeaturedCard,
  LeadStoryCard,
} from "../../components/article/news-card";

/**
 * Trang chủ Editorial News & Minimal Data UI (MST-070, MST-073).
 * Dữ liệu bài viết thật từ GET /articles (mới nhất trước).
 */
export const dynamic = "force-dynamic";

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

async function fetchLatest(limit = 20): Promise<PublishedArticleRecord[]> {
  try {
    const response = await fetch(`${apiBaseUrl()}/articles?limit=${limit}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

export default async function PublicHomePage() {
  const articles = await fetchLatest(20);

  // Phân chia layout:
  // Bài 1: Lead story
  // Bài 2..4: Hero rail phụ
  // Bài 5..8: Featured 4-card strip
  // Bài 9..end: Main stream
  const heroArticle = articles[0];
  const heroRail = articles.slice(1, 4);
  const featuredStrip = articles.slice(4, 8);
  const mainStream = articles.slice(8);

  const breakingArticle = articles.find((a) => a.isBreaking);

  return (
    <main
      className="home-main"
      id="main-content"
      style={{
        maxWidth: "var(--max-content-width, 1280px)",
        margin: "0 auto",
        padding: "20px 16px 48px",
      }}
    >
      <h1 className="visually-hidden">MStudio Channel — Tạp chí tin tức công nghệ và đa nguồn</h1>

      {/* Breaking News Ticker Banner */}
      {breakingArticle ? (
        <aside
          aria-label="Tin nóng khẩn cấp"
          style={{
            background: "linear-gradient(90deg, #fee2e2, #fef2f2)",
            border: "1px solid #fca5a5",
            borderRadius: "var(--radius-sm, 6px)",
            padding: "8px 16px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              background: "var(--breaking-red, #dc2626)",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            TIN NÓNG
          </span>
          <a
            href={`/bai-viet/${breakingArticle.slug || breakingArticle.id}`}
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--ink, #111827)",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {breakingArticle.title}
          </a>
        </aside>
      ) : null}

      {/* SECTION 1: 12-Column Hero Grid (8 cols Lead / 4 cols Rail) */}
      <section
        aria-labelledby="hero-grid-heading"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 28,
          marginBottom: 40,
        }}
      >
        <h2 id="hero-grid-heading" className="visually-hidden">
          Tin tiêu điểm
        </h2>

        {/* Lead Main Story (8 Columns) */}
        <div style={{ gridColumn: "span 12" }} className="lg-col-8">
          {heroArticle ? (
            <LeadStoryCard article={heroArticle} />
          ) : (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                background: "var(--white)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <p style={{ margin: 0, color: "var(--gray)" }}>Đang cập nhật bài viết mới nhất…</p>
            </div>
          )}
        </div>

        {/* Hero Secondary Rail (4 Columns) */}
        <aside
          aria-label="Tin tiêu điểm thứ cấp"
          style={{ gridColumn: "span 12", display: "flex", flexDirection: "column" }}
          className="lg-col-4"
        >
          <div
            style={{
              borderBottom: "2px solid var(--ink, #111827)",
              paddingBottom: 6,
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", margin: 0, letterSpacing: "0.05em" }}>
              Tiêu điểm đáng chú ý
            </h3>
            <span style={{ fontSize: "11px", color: "var(--gray)", fontWeight: 500 }}>Cập nhật liên tục</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {heroRail.map((article) => (
              <CompactNewsCard key={article.id} article={article} />
            ))}
          </div>
        </aside>
      </section>

      {/* SECTION 2: 4-Card Horizontal Featured Strip */}
      {featuredStrip.length > 0 ? (
        <section aria-labelledby="featured-strip-heading" style={{ marginBottom: 48 }}>
          <div
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 id="featured-strip-heading" style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
              Góc nhìn &amp; Chuyên sâu
            </h2>
            <span style={{ fontSize: "12px", color: "var(--accent, #2563eb)", fontWeight: 600 }}>
              Đa nguồn đối chiếu →
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {featuredStrip.map((article) => (
              <FeaturedCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      {/* SECTION 3: Main Stream + Editorial Sidebar (8 cols / 4 cols) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 32,
        }}
      >
        {/* Main Feed Column (8 Columns) */}
        <section
          aria-labelledby="latest-feed-heading"
          style={{ gridColumn: "span 12" }}
          className="lg-col-8"
        >
          <div
            style={{
              borderBottom: "2px solid var(--accent, #2563eb)",
              paddingBottom: 8,
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 id="latest-feed-heading" style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
              Dòng thời sự mới nhất
            </h2>
            <div style={{ display: "flex", gap: 12, fontSize: "13px" }}>
              <span style={{ fontWeight: 600, color: "var(--accent, #2563eb)" }}>Tất cả</span>
              <a href="/cong-nghe" style={{ color: "var(--gray)", textDecoration: "none" }}>Công nghệ</a>
              <a href="/kinh-doanh" style={{ color: "var(--gray)", textDecoration: "none" }}>Kinh doanh</a>
              <a href="/the-gioi" style={{ color: "var(--gray)", textDecoration: "none" }}>Thế giới</a>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {mainStream.length > 0 ? (
              mainStream.map((article) => (
                <CompactNewsCard key={article.id} article={article} />
              ))
            ) : (
              <p style={{ color: "var(--gray)", padding: "20px 0" }}>Đang nạp thêm các bài viết mới…</p>
            )}
          </div>
        </section>

        {/* Sidebar Column (4 Columns) */}
        <aside
          aria-label="Sidebar tiện ích"
          style={{ gridColumn: "span 12", display: "flex", flexDirection: "column", gap: 24 }}
          className="lg-col-4"
        >
          {/* Module 1: AI Lineage Transparency Box */}
          <section
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🛡️</span> Chuẩn mực biên tập MStudio
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-700, #4b5563)", lineHeight: 1.5, margin: 0 }}>
              Mọi bài viết xuất bản đều được tổng hợp đa nguồn, tự động kiểm chứng và truy nguyên nguồn gốc minh bạch với Fact-Check pipeline.
            </p>
          </section>

          {/* Module 2: Trending Topics */}
          <section
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>
              Chủ đề đang quan tâm
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["#TríTuệNhânTạo", "#BánDẫn", "#ThịTrườngTàiChính", "#KhởiNghiệp", "#XeĐiện", "#NăngLượngXanh"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "var(--soft, #f3f4f6)",
                    padding: "4px 10px",
                    borderRadius: 16,
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--ink-700, #374151)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Module 3: Newsletter Box */}
          <section
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#fff",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>
              Bản tin sáng MStudio
            </h3>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.4, margin: "0 0 12px" }}>
              Nhận tóm tắt 5 phút những sự kiện AI và kinh tế quan trọng nhất vào 7:00 sáng mỗi ngày.
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                aria-label="Địa chỉ email để đăng ký bản tin"
                type="email"
                placeholder="email@cuaban.com"
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 4,
                  border: "1px solid #334155",
                  background: "#1e293b",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <button
                type="button"
                style={{
                  background: "var(--accent, #2563eb)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đăng ký
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* Responsive helper styles for CSS grid breakpoints */}
      <style>{`
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
