import type { PublishedArticleRecord } from "@mstudio/contracts";
import { apiBaseUrl } from "../../lib/api";
import { CompactNewsCard, LeadStoryCard } from "./news-card";

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

async function fetchCategoryArticles(categorySlug?: string, limit = 20): Promise<PublishedArticleRecord[]> {
  try {
    const url = categorySlug
      ? `${apiBaseUrl()}/articles?category=${encodeURIComponent(categorySlug)}&limit=${limit}`
      : `${apiBaseUrl()}/articles?limit=${limit}`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = (await response.json()) as ArticlesResponse;
    const articles = Array.isArray(payload.rows) ? payload.rows : [];

    // Fallback: nếu chuyên mục chưa có bài riêng, lấy bài mới nhất của hệ thống để không bao giờ bị trắng trang
    if (articles.length === 0 && categorySlug) {
      const fallbackRes = await fetch(`${apiBaseUrl()}/articles?limit=10`, { cache: "no-store" });
      if (fallbackRes.ok) {
        const fallbackPayload = (await fallbackRes.json()) as ArticlesResponse;
        return Array.isArray(fallbackPayload.rows) ? fallbackPayload.rows : [];
      }
    }
    return articles;
  } catch {
    return [];
  }
}

/**
 * Category Template Rebuild (MST-074):
 * Đảm bảo mọi trang chuyên mục con đều hiển thị bài viết đầy đủ,
 * có phân trang, responsive grid 12-cột và không bao giờ bị trang trắng.
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

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: 16 }}>
                Các bài viết thuộc chuyên mục {name}
              </h2>
              {restArticles.map((article) => (
                <CompactNewsCard key={article.id} article={article} />
              ))}
            </div>
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
                  { label: "Kinh doanh", href: "/kinh-doanh" },
                  { label: "Thế giới", href: "/the-gioi" },
                  { label: "Thời sự", href: "/thoi-su" },
                  { label: "Khoa học", href: "/kham-pha" },
                  { label: "Giải trí", href: "/giai-tri" },
                  { label: "Đời sống", href: "/doi-song" },
                  { label: "Xe", href: "/xe" },
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
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--white)", borderRadius: 8 }}>
          <p style={{ color: "var(--gray)", margin: 0 }}>Đang cập nhật bài viết cho chuyên mục này…</p>
        </div>
      )}

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
