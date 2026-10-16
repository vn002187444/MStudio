import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import { CompactNewsCard, LeadStoryCard } from "./news-card";

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

/**
 * Fetch articles strictly belonging to the given categorySlug.
 * Never silently fall back to general articles without user awareness.
 */
async function fetchCategoryArticles(categorySlug?: string, limit = 20): Promise<PublishedArticleRecord[]> {
  try {
    const url = categorySlug
      ? `/articles?category=${encodeURIComponent(categorySlug)}&limit=${limit}`
      : `/articles?limit=${limit}`;
    const response = await fetchApi(url, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

/**
 * Fetch recent articles for the suggestion block when category is empty.
 */
async function fetchSuggestedArticles(limit = 6): Promise<PublishedArticleRecord[]> {
  try {
    const response = await fetchApi(`/articles?limit=${limit}`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    return Array.isArray(payload.rows) ? payload.rows : [];
  } catch {
    return [];
  }
}

/**
 * Category Template:
 * Renders verified category-specific articles in a 12-column responsive layout.
 * If no articles exist for this category yet, renders an informative empty state
 * followed by a clearly labeled system suggestion stream.
 */
export async function CategoryTemplate({
  name,
  description,
  categorySlug,
}: {
  name: string;
  description: string;
  categorySlug?: string;
}) {
  const articles = await fetchCategoryArticles(categorySlug, 20);
  const suggestedArticles = articles.length === 0 ? await fetchSuggestedArticles(6) : [];
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
          <span style={{ color: "var(--accent, #2563eb)", fontSize: "13px", fontWeight: 600 }}>Chuyên mục</span>
        </div>
        <h1 style={{ fontSize: "var(--text-4xl, 36px)", fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2 }}>
          {name}
        </h1>
        <p style={{ color: "var(--ink-700, #4b5563)", fontSize: "var(--text-base, 16px)", margin: 0, maxWidth: 720 }}>
          {description}
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 32,
        }}
      >
        {/* Main Column (8 Columns) */}
        <div style={{ gridColumn: "span 12" }} className="lg-col-8">
          {articles.length > 0 ? (
            <>
              {heroArticle ? (
                <div style={{ marginBottom: 32 }}>
                  <LeadStoryCard article={heroArticle} />
                </div>
              ) : null}

              {restArticles.length > 0 ? (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: 16 }}>
                    Các bài viết thuộc chuyên mục {name}
                  </h2>
                  {restArticles.map((article) => (
                    <CompactNewsCard key={article.id} article={article} />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* Friendly Empty State */}
              <section
                aria-labelledby="empty-cat-heading"
                style={{
                  background: "var(--white)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  padding: "40px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: 12 }} aria-hidden="true">📰</div>
                <h2 id="empty-cat-heading" style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
                  Chuyên mục {name} đang được ban biên tập tổng hợp
                </h2>
                <p style={{ color: "var(--ink-700, #4b5563)", fontSize: "14px", margin: "0 auto 20px", maxWidth: 520, lineHeight: 1.5 }}>
                  Các bài viết chuyên sâu về {name.toLowerCase()} đang trong quy trình biên soạn và kiểm chứng nguồn. Bạn có thể theo dõi những tin tức mới nhất từ hệ thống dưới đây.
                </p>
                <a
                  href="/moi-nhat"
                  style={{
                    display: "inline-block",
                    background: "var(--ink)",
                    color: "white",
                    padding: "8px 18px",
                    borderRadius: 6,
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Xem dòng tin mới nhất →
                </a>
              </section>

              {/* Clearly separated recent suggestions */}
              {suggestedArticles.length > 0 ? (
                <section aria-labelledby="suggested-heading" style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <h2 id="suggested-heading" style={{ fontSize: "17px", fontWeight: 700, marginBottom: 16, color: "var(--ink)" }}>
                    Tin tức nổi bật khác trên MStudio Channel
                  </h2>
                  {suggestedArticles.map((article) => (
                    <CompactNewsCard key={article.id} article={article} />
                  ))}
                </section>
              ) : null}
            </div>
          )}
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
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 8px" }}>
              Về chuyên mục {name}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--ink-700, #4b5563)", lineHeight: 1.5, margin: 0 }}>
              Tuyển chọn những tin tức mới nhất, phân tích đa chiều và dữ liệu kiểm chứng độc quyền bởi ban biên tập MStudio Channel.
            </p>
          </section>

          <section
            style={{
              background: "var(--soft, #f8fafc)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>
              Khám phá chuyên mục khác
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Công nghệ", href: "/cong-nghe" },
                { label: "AI Channel", href: "/ai-channel" },
                { label: "Kinh doanh", href: "/kinh-doanh" },
                { label: "Kinh tế", href: "/kinh-te" },
                { label: "Thế giới", href: "/the-gioi" },
                { label: "Thời sự", href: "/thoi-su" },
                { label: "Khoa học", href: "/khoa-hoc" },
                { label: "Thể thao", href: "/the-thao" },
                { label: "Giải trí", href: "/giai-tri" },
                { label: "Đời sống", href: "/doi-song" },
                { label: "Xe", href: "/xe" },
                { label: "Sức khỏe", href: "/suc-khoe" },
                { label: "Giáo dục", href: "/giao-duc" },
              ].map((cat) => (
                <a
                  key={cat.href}
                  href={cat.href}
                  style={{
                    background: "var(--white)",
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
        </aside>
      </div>

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
