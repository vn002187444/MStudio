import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import { CompactNewsCard, LeadStoryCard } from "./news-card";
import { BentoGrid, BentoCard } from "@mstudio/ui";

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
 * Category Template (MST-110 Hybrid Glassmorphic):
 * Renders verified category-specific articles in a 12-column responsive Bento layout.
 * Includes fallback logic and suggested streams.
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
      className="home-main min-h-screen bg-[var(--solar-light)] pt-8 pb-24"
      id="main-content"
    >
      <div className="container-content max-w-[var(--container)] mx-auto px-4">
        {/* Category Header */}
        <header className="mb-12 border-b border-black/10 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <a href="/" className="text-gray-500 text-sm hover:text-black transition-colors">Trang chủ</a>
            <span className="text-gray-400 text-xs">/</span>
            <span className="text-blue-600 text-sm font-semibold">Chuyên mục</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-4">
            {name}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        </header>

        <BentoGrid>
          {/* Main Column (8 Columns) */}
          <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
            {articles.length > 0 ? (
              <div className="flex flex-col gap-8">
                {heroArticle && (
                  <div className="mb-4">
                    <LeadStoryCard article={heroArticle} />
                  </div>
                )}

                {restArticles.length > 0 && (
                  <div className="bg-white rounded-[var(--bento-radius-outer)] border border-black/5 p-[var(--bento-padding)] shadow-sm">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-black/5 pb-4">
                      Các bài viết thuộc chuyên mục {name}
                    </h2>
                    <div className="flex flex-col gap-4">
                      {restArticles.map((article) => (
                        <CompactNewsCard key={article.id} article={article} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Friendly Empty State */}
                <section
                  aria-labelledby="empty-cat-heading"
                  className="bg-white rounded-[var(--bento-radius-outer)] border border-blue-100 p-10 text-center shadow-sm"
                >
                  <div className="text-5xl mb-4" aria-hidden="true">📰</div>
                  <h2 id="empty-cat-heading" className="text-2xl font-bold mb-3 text-black">
                    Chuyên mục {name} đang được ban biên tập tổng hợp
                  </h2>
                  <p className="text-gray-600 text-base max-w-xl mx-auto mb-6 leading-relaxed">
                    Các bài viết chuyên sâu về {name.toLowerCase()} đang trong quy trình biên soạn và kiểm chứng nguồn. Bạn có thể theo dõi những tin tức mới nhất từ hệ thống dưới đây.
                  </p>
                  <a
                    href="/moi-nhat"
                    className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Xem dòng tin mới nhất →
                  </a>
                </section>

                {/* Clearly separated recent suggestions */}
                {suggestedArticles.length > 0 && (
                  <section aria-labelledby="suggested-heading" className="bg-white rounded-[var(--bento-radius-outer)] border border-black/5 p-[var(--bento-padding)] shadow-sm">
                    <h2 id="suggested-heading" className="text-xl font-bold mb-6 text-black border-b border-black/5 pb-4">
                      Tin tức nổi bật khác trên MStudio Channel
                    </h2>
                    <div className="flex flex-col gap-4">
                      {suggestedArticles.map((article) => (
                        <CompactNewsCard key={article.id} article={article} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </BentoCard>

          {/* Sidebar Column (4 Columns) */}
          <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
            <div className="flex flex-col gap-6">
              <section className="bg-[var(--void-surface)] text-white rounded-[var(--bento-radius-outer)] p-[var(--bento-padding)] shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-3">Về chuyên mục {name}</h3>
                  <p className="text-sm text-white/70 leading-relaxed m-0">
                    Tuyển chọn những tin tức mới nhất, phân tích đa chiều và dữ liệu kiểm chứng độc quyền bởi ban biên tập MStudio Channel.
                  </p>
                </div>
              </section>

              <section className="bg-white rounded-[var(--bento-radius-outer)] border border-black/5 p-[var(--bento-padding)] shadow-sm">
                <h3 className="text-base font-bold mb-4">Khám phá chuyên mục khác</h3>
                <div className="flex flex-wrap gap-2">
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
                      className="px-4 py-2 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-full text-xs font-semibold text-gray-700"
                    >
                      {cat.label}
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </main>
  );
}
