import type { Metadata } from "next";
import { primaryNav } from "../../../components/navigation/taxonomy";
import { fetchApi } from "../../../lib/api";
import {
  fetchArticleById,
  fetchLatestArticles,
  type PublishedArticle,
} from "../../../lib/content/articles";
import {
  CATEGORY_NAMES,
  CATEGORY_FALLBACK_IMAGES,
  formatRelativeTime,
  getCategoryBadgeClass,
} from "../../../components/article/news-card";
import { FollowTopicButton, HideTopicButton } from "../../../components/discovery/follow-controls";

export const metadata: Metadata = {
  title: "Dành cho bạn | MStudio Channel",
  description: "Trang tin tức cá nhân hóa minh bạch — xếp hạng theo thói quen đọc và chủ đề bạn quan tâm.",
  robots: {
    index: true,
    follow: true,
  },
};

interface RecommendationCandidate {
  articleId: string;
  pool: "fresh" | "trending" | "followed" | "related";
  score: number;
  reason: string;
}

interface RecommendationsResponse {
  candidates: RecommendationCandidate[];
}

interface EnrichedRecommendation {
  candidate: RecommendationCandidate;
  article: PublishedArticle;
}

const POOL_CONFIG: Record<
  RecommendationCandidate["pool"],
  { label: string; bg: string; text: string; icon: string }
> = {
  trending: {
    label: "Đang nóng",
    bg: "bg-amber-500/10 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: "🔥",
  },
  fresh: {
    label: "Mới cập nhật",
    bg: "bg-blue-500/10 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: "✨",
  },
  followed: {
    label: "Chủ đề bạn theo dõi",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: "📌",
  },
  related: {
    label: "Liên quan đến gu đọc",
    bg: "bg-purple-500/10 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
    icon: "🎯",
  },
};

async function getEnrichedRecommendations(): Promise<EnrichedRecommendation[]> {
  try {
    const response = await fetchApi("/recommendations?limit=12", {
      next: { revalidate: 60 },
    });

    let candidates: RecommendationCandidate[] = [];
    if (response.ok) {
      const payload = (await response.json()) as RecommendationsResponse;
      if (Array.isArray(payload.candidates)) {
        candidates = payload.candidates;
      }
    }

    // Resolve thông tin chi tiết bài viết
    const enrichedList: EnrichedRecommendation[] = [];
    const seenIds = new Set<string>();

    for (const cand of candidates) {
      if (!cand.articleId || seenIds.has(cand.articleId)) continue;
      const article = await fetchArticleById(cand.articleId);
      if (article) {
        seenIds.add(cand.articleId);
        enrichedList.push({ candidate: cand, article });
      }
    }

    // Fallback: Nếu hệ thống chưa đủ candidates đề xuất, bổ sung các bài mới nhất
    if (enrichedList.length < 8) {
      const latestArticles = await fetchLatestArticles(8);
      for (const article of latestArticles) {
        if (!seenIds.has(article.id)) {
          seenIds.add(article.id);
          enrichedList.push({
            candidate: {
              articleId: article.id,
              pool: "fresh",
              score: 1.0,
              reason: "Bài viết mới được ban biên tập tổng hợp và kiểm chứng đa nguồn.",
            },
            article,
          });
          if (enrichedList.length >= 8) break;
        }
      }
    }

    return enrichedList;
  } catch {
    // Fallback hoàn toàn nếu API recommendations gặp lỗi
    const latestArticles = await fetchLatestArticles(8);
    return latestArticles.map((article) => ({
      candidate: {
        articleId: article.id,
        pool: "fresh",
        score: 1.0,
        reason: "Bài viết mới nhất trên hệ thống tin tức MStudio Channel.",
      },
      article,
    }));
  }
}

export default async function ForYouPage() {
  const recommendations = await getEnrichedRecommendations();

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
          paddingBottom: 20,
          marginBottom: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <a href="/" style={{ color: "var(--gray)", fontSize: "13px", textDecoration: "none" }}>
            Trang chủ
          </a>
          <span style={{ color: "var(--gray)", fontSize: "12px" }}>/</span>
          <span style={{ color: "var(--accent, #2563eb)", fontSize: "13px", fontWeight: 600 }}>
            Dành cho bạn
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 36px)",
            fontWeight: 800,
            margin: "0 0 10px",
            lineHeight: 1.2,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          Dành riêng cho bạn ✨
        </h1>
        <p
          style={{
            color: "var(--ink-700, #4b5563)",
            fontSize: "15px",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 780,
            background: "var(--soft, #f8fafc)",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          Luồng tin đề xuất minh bạch tổng hợp từ các sự kiện nóng, chuyên mục bạn theo dõi và tín hiệu
          đọc thực tế. Không sử dụng thuật toán thao túng tâm lý; bạn toàn quyền quyết định chủ đề xuất hiện.
        </p>
      </header>

      {/* Main Grid: 2 Columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 32,
        }}
      >
        {/* Left Column: Recommendations Feed (8 cols on desktop) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <section aria-labelledby="foryou-feed-heading">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border,#E3E5E8)]">
              <h2 id="foryou-feed-heading" className="text-[18px] font-bold text-[var(--ink,#101114)] m-0">
                Gợi ý bản tin hôm nay
              </h2>
              <span className="text-[13px] text-[var(--gray,#667085)] font-medium">
                {recommendations.length} bài viết phù hợp
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  background: "var(--soft, #f8fafc)",
                  borderRadius: 12,
                  border: "1px dashed var(--border)",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: 12 }}>🗞️</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
                  Chưa có gợi ý phù hợp
                </h3>
                <p style={{ color: "var(--gray)", fontSize: "14px", maxWidth: 440, margin: "0 auto" }}>
                  Hãy bấm Theo dõi các chủ đề yêu thích ở cột bên phải để MStudio cá nhân hóa danh sách tin tức cho bạn.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {recommendations.map(({ candidate, article }) => {
                  const poolInfo = POOL_CONFIG[candidate.pool] ?? POOL_CONFIG.fresh;
                  const articleUrl = `/bai-viet/${article.slug || article.id}`;
                  const categorySlug = article.categorySlug || "cong-nghe";
                  const categoryName = CATEGORY_NAMES[categorySlug] || "Tin tức";
                  const imageUrl =
                    article.heroImageUrl && article.heroImageUrl.trim() !== ""
                      ? article.heroImageUrl
                      : CATEGORY_FALLBACK_IMAGES[categorySlug] ?? CATEGORY_FALLBACK_IMAGES["cong-nghe"];

                  return (
                    <article
                      key={`${candidate.pool}-${article.id}`}
                      className="group rounded-xl border border-[var(--border,#E3E5E8)] bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:border-[var(--brand,#155EEF)]"
                    >
                      {/* Pool Tag + Category Header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${poolInfo.bg} ${poolInfo.text}`}
                          >
                            <span>{poolInfo.icon}</span>
                            <span>{poolInfo.label}</span>
                          </span>
                          <a
                            href={`/${categorySlug}`}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(categorySlug)} hover:underline`}
                          >
                            {categoryName}
                          </a>
                        </div>
                        <time
                          dateTime={article.updatedAt}
                          className="text-[12px] text-[var(--gray,#667085)]"
                        >
                          {formatRelativeTime(article.updatedAt)}
                        </time>
                      </div>

                      {/* Article Content: Two columns on sm screen */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="m-0 text-[17px] sm:text-[19px] font-bold leading-snug text-[var(--ink,#101114)] group-hover:text-[var(--brand,#155EEF)] transition-colors">
                            <a href={articleUrl} className="hover:underline focus-visible:outline-2">
                              {article.title}
                            </a>
                          </h3>
                          {article.summary ? (
                            <p className="mt-2 text-[14px] sm:text-[15px] text-[var(--ink-700,#4b5563)] line-clamp-2 leading-relaxed">
                              {article.summary}
                            </p>
                          ) : null}
                        </div>

                        {imageUrl ? (
                          <a
                            href={articleUrl}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="relative w-full sm:w-[140px] md:w-[160px] h-[100px] shrink-0 rounded-lg overflow-hidden bg-slate-100 block"
                          >
                            <img
                              src={imageUrl}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </a>
                        ) : null}
                      </div>

                      {/* Explanation Box (Vì sao tôi thấy tin này) */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="text-amber-500 font-bold" aria-hidden="true">💡</span>
                          <span className="text-[12px] sm:text-[13px]">{candidate.reason}</span>
                        </div>
                        <a
                          href={articleUrl}
                          style={{ color: "#ffffff", backgroundColor: "#090909" }}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md !text-white text-[12px] font-semibold hover:bg-slate-800 transition-colors shrink-0"
                        >
                          <span style={{ color: "#ffffff" }}>Đọc bài viết</span>
                          <span aria-hidden="true" style={{ color: "#ffffff" }}>→</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Manage Topics (4 cols on desktop) */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="sticky top-20 rounded-xl border border-[var(--border,#E3E5E8)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[var(--border,#E3E5E8)]">
              <span className="text-[20px]" aria-hidden="true">🗂️</span>
              <div>
                <h2 id="topics-manage-heading" className="text-[16px] font-bold text-[var(--ink,#101114)] m-0">
                  Tùy biến luồng tin
                </h2>
                <p className="text-[12px] text-[var(--gray,#667085)] m-0">
                  Theo dõi hoặc ẩn các chuyên mục
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[var(--ink-700,#4b5563)] leading-relaxed mb-4">
              Nhấn <strong>Theo dõi</strong> để ưu tiên bài viết vào trang này hoặc <strong>Ẩn</strong> nếu không quan tâm:
            </p>

            <ul className="divide-y divide-slate-100 m-0 p-0 list-none">
              {primaryNav.map((topic) => (
                <li
                  key={topic.href}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <a
                    href={topic.href}
                    className="text-[14px] font-medium text-[var(--ink,#101114)] hover:text-[var(--brand,#155EEF)] hover:underline"
                  >
                    {topic.label}
                  </a>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FollowTopicButton topicId={topic.href} topicLabel={topic.label} />
                    <HideTopicButton topicId={topic.href} topicLabel={topic.label} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[12px] text-slate-600 leading-normal">
              🔒 Lựa chọn theo dõi được lưu an toàn trên trình duyệt của bạn và tôn trọng quyền riêng tư độc giả tuyệt đối.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
