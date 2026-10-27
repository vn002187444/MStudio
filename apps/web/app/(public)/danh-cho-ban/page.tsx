import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { primaryNav } from "../../../components/navigation/taxonomy";
import { CATEGORY_FALLBACK_IMAGES, CATEGORY_NAMES, formatRelativeTime } from "../../../components/article/news-card";
import { fetchApi } from "../../../lib/api";
import {
  fetchArticleById,
  fetchLatestArticles,
  type PublishedArticle,
} from "../../../lib/content/articles";
import { FollowTopicButton, HideTopicButton } from "../../../components/discovery/follow-controls";
import { BentoGrid, BentoCard, AmbientGlow } from "@mstudio/ui";

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
    bg: "bg-amber-950/80 border-amber-500/50",
    text: "text-amber-300",
    icon: "🔥",
  },
  fresh: {
    label: "Mới cập nhật",
    bg: "bg-cyan-950/80 border-cyan-500/50",
    text: "text-cyan-300",
    icon: "✨",
  },
  followed: {
    label: "Chủ đề bạn theo dõi",
    bg: "bg-emerald-950/80 border-emerald-500/50",
    text: "text-emerald-300",
    icon: "📌",
  },
  related: {
    label: "Liên quan đến gu đọc",
    bg: "bg-purple-950/80 border-purple-500/50",
    text: "text-purple-300",
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

    const enrichedList: EnrichedRecommendation[] = [];
    const seenIds = new Set<string>();

    const candIds = candidates
      .map((c) => c.articleId)
      .filter((id): id is string => Boolean(id) && !seenIds.has(id));
    const uniqueIds = Array.from(new Set(candIds));

    if (uniqueIds.length > 0) {
      const response = await fetchApi(`/articles?ids=${uniqueIds.join(",")}`, {
        next: { revalidate: 60 },
      });
      if (response.ok) {
        const payload = (await response.json()) as { rows?: PublishedArticle[] };
        const articles = payload.rows || [];
        const articleMap = new Map(articles.map((a) => [a.id, a]));

        for (const cand of candidates) {
          if (!cand.articleId || seenIds.has(cand.articleId)) continue;
          const article = articleMap.get(cand.articleId);
          if (article) {
            seenIds.add(cand.articleId);
            enrichedList.push({ candidate: cand, article });
          }
        }
      }
    }

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
      className="home-main relative min-h-screen bg-[#07080B] text-slate-100 pt-6 pb-28 overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(37,99,235,0.2)" size={500} className="-top-40 -left-20 pointer-events-none" />

      <div className="container-content max-w-[var(--container)] mx-auto px-4 relative z-10">
        {/* Page Header */}
        <header className="mb-10 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Dành cho bạn</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white m-0 flex items-center gap-3">
            Dành riêng cho bạn ✨
          </h1>

          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed m-0 font-normal">
            Luồng tin đề xuất minh bạch tổng hợp từ các sự kiện nóng, chuyên mục bạn theo dõi và tín hiệu
            đọc thực tế. Không sử dụng thuật toán thao túng tâm lý; bạn toàn quyền quyết định chủ đề xuất hiện.
          </p>
        </header>

        {/* Main Grid: 2 Columns */}
        <BentoGrid>
          {/* Left Column: Recommendations Feed (8 cols on desktop) */}
          <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
            <section aria-labelledby="foryou-feed-heading">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-white/10">
                <h2 id="foryou-feed-heading" className="text-lg md:text-xl font-bold text-white m-0 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  Gợi ý bản tin hôm nay
                </h2>
                <span className="text-xs text-slate-400 font-mono font-medium">
                  {recommendations.length} bài viết phù hợp
                </span>
              </div>

              {recommendations.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-12 text-center shadow-xl">
                  <div className="text-4xl mb-3">🗞️</div>
                  <h3 className="text-base font-bold text-white mb-2">Chưa có gợi ý phù hợp</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto m-0">
                    Hãy bấm Theo dõi các chủ đề yêu thích ở cột bên phải để MStudio cá nhân hóa danh sách tin tức cho bạn.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {recommendations.map(({ candidate, article }) => {
                    const poolInfo = POOL_CONFIG[candidate.pool] ?? POOL_CONFIG.fresh;
                    const articleUrl = `/bai-viet/${article.slug || article.id}`;
                    const categorySlug = article.categorySlug || "cong-nghe";
                    const categoryName = CATEGORY_NAMES[categorySlug] || "Tin tức";
                    const imageUrl =
                      article.heroImageUrl && article.heroImageUrl.trim() !== ""
                        ? article.heroImageUrl
                        : CATEGORY_FALLBACK_IMAGES[categorySlug] ?? CATEGORY_FALLBACK_IMAGES["thoi-su"];

                    return (
                      <article
                        key={`${candidate.pool}-${article.id}`}
                        className="group rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-xl hover:border-cyan-500/40 transition-all"
                      >
                        {/* Pool Tag + Category Header */}
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${poolInfo.bg} ${poolInfo.text}`}
                            >
                              <span>{poolInfo.icon}</span>
                              <span>{poolInfo.label}</span>
                            </span>
                            <a
                              href={`/${categorySlug}`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors"
                            >
                              {categoryName}
                            </a>
                          </div>
                          <time
                            dateTime={article.updatedAt}
                            className="text-xs text-slate-400 font-mono"
                          >
                            {formatRelativeTime(article.updatedAt)}
                          </time>
                        </div>

                        {/* Article Content */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="m-0 text-base md:text-lg font-bold leading-snug text-white group-hover:text-cyan-300 transition-colors">
                              <a href={articleUrl} className="text-white group-hover:text-cyan-300 outline-none">
                                {article.title}
                              </a>
                            </h3>
                            {article.summary ? (
                              <p className="mt-2 text-xs md:text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                                {article.summary}
                              </p>
                            ) : null}
                          </div>

                          {imageUrl ? (
                            <a
                              href={articleUrl}
                              tabIndex={-1}
                              aria-hidden="true"
                              className="relative w-full sm:w-[140px] md:w-[160px] h-[100px] shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-white/10 block group-hover:shadow-lg transition-shadow"
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

                        {/* Explanation Box */}
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-amber-400 font-bold" aria-hidden="true">💡</span>
                            <span className="text-xs font-medium">{candidate.reason}</span>
                          </div>
                          <a
                            href={articleUrl}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs hover:from-blue-500 hover:to-cyan-400 shadow-md shadow-cyan-500/20 transition-all border border-cyan-400/30 shrink-0"
                          >
                            <span>Đọc bài viết</span>
                            <span aria-hidden="true">→</span>
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </BentoCard>

          {/* Right Column: Manage Topics (4 cols on desktop) */}
          <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-white/10">
                <span className="text-xl" aria-hidden="true">🗂️</span>
                <div>
                  <h2 id="topics-manage-heading" className="text-base font-bold text-white m-0">
                    Tùy biến luồng tin
                  </h2>
                  <p className="text-xs text-slate-400 m-0 font-normal">
                    Theo dõi hoặc ẩn các chuyên mục
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4 font-normal">
                Nhấn <strong className="text-white">Theo dõi</strong> để ưu tiên bài viết vào trang này hoặc <strong className="text-white">Ẩn</strong> nếu không quan tâm:
              </p>

              <ul className="divide-y divide-white/5 m-0 p-0 list-none">
                {primaryNav.map((topic) => (
                  <li
                    key={topic.href}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <a
                      href={topic.href}
                      className="text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
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

              <div className="mt-5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 leading-relaxed">
                🔒 Lựa chọn theo dõi được lưu an toàn trên trình duyệt của bạn và tôn trọng quyền riêng tư độc giả tuyệt đối.
              </div>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </main>
  );
}
