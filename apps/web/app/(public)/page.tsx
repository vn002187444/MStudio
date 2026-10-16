import type { PublishedArticleRecord } from "../../lib/contracts";
import { apiBaseUrl, fetchApi } from "../../lib/api";
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
    const response = await fetchApi(`/articles?limit=${limit}`, {
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
    <main className="home-main container-content" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — Tạp chí tin tức công nghệ và đa nguồn</h1>

      {/* Breaking News Ticker Banner */}
      {breakingArticle ? (
        <aside
          aria-label="Tin nóng khẩn cấp"
          className="breaking-banner"
        >
          <span className="breaking-badge">TIN NÓNG</span>
          <a
            href={`/bai-viet/${breakingArticle.slug || breakingArticle.id}`}
            className="breaking-link"
          >
            {breakingArticle.title}
          </a>
        </aside>
      ) : null}

      {/* SECTION 1: 12-Column Hero Grid (8 cols Lead / 4 cols Rail) */}
      <section aria-labelledby="hero-grid-heading" className="hero-grid">
        <h2 id="hero-grid-heading" className="visually-hidden">
          Tin tiêu điểm
        </h2>

        {/* Lead Main Story (8 Columns on desktop) */}
        <div className="hero-main">
          {heroArticle ? (
            <LeadStoryCard article={heroArticle} />
          ) : (
            <div className="hero-empty">
              <p>Đang cập nhật bài viết mới nhất…</p>
            </div>
          )}
        </div>

        {/* Hero Secondary Rail (4 Columns on desktop) */}
        <aside aria-label="Tin tiêu điểm thứ cấp" className="hero-rail">
          <div className="section-divider-sm">
            <h3 className="section-label">Tiêu điểm đáng chú ý</h3>
            <span className="section-meta">Cập nhật liên tục</span>
          </div>

          <div className="card-list">
            {heroRail.map((article) => (
              <CompactNewsCard key={article.id} article={article} />
            ))}
          </div>
        </aside>
      </section>

      {/* SECTION 2: 4-Card Horizontal Featured Strip */}
      {featuredStrip.length > 0 ? (
        <section aria-labelledby="featured-strip-heading" className="featured-section">
          <div className="section-header">
            <h2 id="featured-strip-heading" className="section-title">
              Tin nổi bật
            </h2>
            <a href="/moi-nhat" className="section-link">
              Xem tất cả →
            </a>
          </div>

          <div className="featured-grid">
            {featuredStrip.map((article) => (
              <FeaturedCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}

      {/* SECTION 3: Main Stream + Editorial Sidebar (8 cols / 4 cols) */}
      <div className="home-columns">
        {/* Main Feed Column (8 Columns) */}
        <section aria-labelledby="latest-feed-heading" className="main-feed">
          <div className="section-header section-header--ink">
            <h2 id="latest-feed-heading" className="section-title">
              Dòng thời sự mới nhất
            </h2>
            <div className="feed-filters">
              <span className="filter-active">Tất cả</span>
              <a href="/cong-nghe" className="filter-link">Công nghệ</a>
              <a href="/kinh-doanh" className="filter-link">Kinh doanh</a>
              <a href="/the-gioi" className="filter-link">Thế giới</a>
            </div>
          </div>

          <div className="card-list">
            {mainStream.length > 0 ? (
              mainStream.map((article) => (
                <CompactNewsCard key={article.id} article={article} />
              ))
            ) : (
              <p className="empty-text">Đang nạp thêm các bài viết mới…</p>
            )}
          </div>
        </section>

        {/* Sidebar Column (4 Columns) */}
        <aside aria-label="Sidebar tiện ích" className="home-sidebar">
          {/* Module 1: AI Lineage Transparency Box */}
          <section className="sidebar-module">
            <h3 className="sidebar-heading">
              <span aria-hidden="true">🛡️</span> Chuẩn mực biên tập MStudio
            </h3>
            <p className="sidebar-text">
              Mọi bài viết xuất bản đều được tổng hợp đa nguồn, tự động kiểm chứng và truy nguyên nguồn gốc minh bạch với Fact-Check pipeline.
            </p>
          </section>

          {/* Module 2: Trending Topics */}
          <section className="sidebar-module">
            <h3 className="sidebar-heading">Chủ đề đang quan tâm</h3>
            <div className="topic-pills">
              {["#TríTuệNhânTạo", "#BánDẫn", "#ThịTrườngTàiChính", "#KhởiNghiệp", "#XeĐiện", "#NăngLượngXanh"].map((tag) => (
                <span key={tag} className="topic-pill">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Module 3: Newsletter Box */}
          <section className="newsletter-box">
            <h3 className="newsletter-heading">Bản tin sáng MStudio</h3>
            <p className="newsletter-desc">
              Nhận tóm tắt 5 phút những sự kiện AI và kinh tế quan trọng nhất vào 7:00 sáng mỗi ngày.
            </p>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="email@cuaban.com"
                className="newsletter-input"
              />
              <button type="button" className="newsletter-btn">
                Đăng ký
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
