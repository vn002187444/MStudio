import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import { CompactNewsCard, LeadStoryCard } from "./news-card";
import {
  BentoGrid,
  BentoCard,
  AmbientGlow,
  AIBenchmarkWidget,
  BentoMarketStrip,
  CrisisTimeline,
  ScienceDataBox,
  EVParamWidget,
  HealthAirQualityWidget,
} from "@mstudio/ui";

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

function getCategoryTheme(slug?: string) {
  switch (slug) {
    case "cong-nghe":
    case "ai-channel":
      return {
        auraColor: "rgba(6, 182, 212, 0.25)",
        accentText: "text-cyan-300",
        badgeBg: "bg-cyan-950/80 border-cyan-500/50 text-cyan-300",
        tag: "Tech & AI Frontier",
      };
    case "kinh-doanh":
    case "kinh-te":
      return {
        auraColor: "rgba(16, 185, 129, 0.25)",
        accentText: "text-emerald-300",
        badgeBg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
        tag: "Finance & Economy",
      };
    case "thoi-su":
    case "the-gioi":
      return {
        auraColor: "rgba(245, 158, 11, 0.25)",
        accentText: "text-amber-300",
        badgeBg: "bg-amber-950/80 border-amber-500/50 text-amber-300",
        tag: "Global Pulse",
      };
    case "khoa-hoc":
      return {
        auraColor: "rgba(99, 102, 241, 0.25)",
        accentText: "text-indigo-300",
        badgeBg: "bg-indigo-950/80 border-indigo-500/50 text-indigo-300",
        tag: "Quantum & Space",
      };
    case "xe":
      return {
        auraColor: "rgba(239, 68, 68, 0.25)",
        accentText: "text-red-300",
        badgeBg: "bg-red-950/80 border-red-500/50 text-red-300",
        tag: "Mobility & EV",
      };
    case "doi-song":
    case "suc-khoe":
      return {
        auraColor: "rgba(20, 184, 166, 0.25)",
        accentText: "text-teal-300",
        badgeBg: "bg-teal-950/80 border-teal-500/50 text-teal-300",
        tag: "Lifestyle & Wellness",
      };
    default:
      return {
        auraColor: "rgba(59, 130, 246, 0.25)",
        accentText: "text-blue-300",
        badgeBg: "bg-blue-950/80 border-blue-500/50 text-blue-300",
        tag: "Editorial Stream",
      };
  }
}

function renderCategoryWidget(slug?: string) {
  switch (slug) {
    case "cong-nghe":
    case "ai-channel":
      return <AIBenchmarkWidget className="mb-6" />;
    case "kinh-doanh":
    case "kinh-te":
      return <BentoMarketStrip className="mb-6" />;
    case "thoi-su":
    case "the-gioi":
      return <CrisisTimeline className="mb-6" />;
    case "khoa-hoc":
      return <ScienceDataBox className="mb-6" />;
    case "xe":
      return <EVParamWidget className="mb-6" />;
    case "doi-song":
    case "suc-khoe":
      return <HealthAirQualityWidget className="mb-6" />;
    default:
      return null;
  }
}

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
  const theme = getCategoryTheme(categorySlug);

  return (
    <main
      className="home-main relative min-h-screen bg-[#07080B] text-slate-100 pt-6 pb-28 overflow-hidden"
      id="main-content"
    >
      {/* Category Ambient Optical Aura */}
      <AmbientGlow
        color={theme.auraColor}
        size={540}
        className="-top-40 -left-20 pointer-events-none opacity-80"
      />
      <AmbientGlow
        color={theme.auraColor}
        size={420}
        className="top-96 -right-24 pointer-events-none opacity-50"
      />

      <div className="container-content max-w-[var(--container)] mx-auto px-4 relative z-10">
        {/* Category Glass Header */}
        <header className="relative mb-10 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
              <span>/</span>
              <span className="text-slate-400">Chuyên mục</span>
              <span>/</span>
              <span className={`font-bold ${theme.accentText}`}>{name}</span>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider ${theme.badgeBg}`}>
              {theme.tag}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">
            {name}
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
            {description}
          </p>
        </header>

        <BentoGrid>
          {/* Main Column (8 Columns) */}
          <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
            {/* Top specialized widget if business or market */}
            {(categorySlug === "kinh-doanh" || categorySlug === "kinh-te") && (
              <div className="mb-6">{renderCategoryWidget(categorySlug)}</div>
            )}

            {articles.length > 0 ? (
              <div className="flex flex-col gap-8">
                {heroArticle && (
                  <div>
                    <LeadStoryCard article={heroArticle} />
                  </div>
                )}

                {restArticles.length > 0 && (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 md:p-6 backdrop-blur-xl shadow-xl">
                    <h2 className="text-lg md:text-xl font-bold mb-5 flex items-center gap-2 border-b border-white/10 pb-3 text-white">
                      <span className={`h-2.5 w-2.5 rounded-full ${theme.accentText} bg-current`} />
                      Các bài viết mới nhất thuộc {name}
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
                {/* Glassmorphic Empty State */}
                <section
                  aria-labelledby="empty-cat-heading"
                  className="rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center backdrop-blur-2xl shadow-xl"
                >
                  <div className="text-5xl mb-4" aria-hidden="true">🌌</div>
                  <h2 id="empty-cat-heading" className="text-2xl font-bold mb-3 text-white">
                    Chuyên mục {name} đang được ban biên tập tổng hợp
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-6 leading-relaxed">
                    Các bài viết chuyên sâu về {name.toLowerCase()} đang trong quy trình phân tích và đối chiếu nguồn tin tự động. Bạn có thể theo dõi những luồng tin mới nhất từ hệ thống dưới đây.
                  </p>
                  <a
                    href="/moi-nhat"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-bold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/25 border border-cyan-400/40"
                  >
                    Xem dòng tin mới nhất →
                  </a>
                </section>

                {suggestedArticles.length > 0 && (
                  <section
                    aria-labelledby="suggested-heading"
                    className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 md:p-6 backdrop-blur-xl shadow-xl"
                  >
                    <h2 id="suggested-heading" className="text-lg font-bold mb-5 text-white border-b border-white/10 pb-3">
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
              {/* Category-Specific Sidebar Widget */}
              {categorySlug !== "kinh-doanh" && categorySlug !== "kinh-te" && renderCategoryWidget(categorySlug)}

              {/* Editorial Statement */}
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-5 backdrop-blur-2xl shadow-xl">
                <AmbientGlow color={theme.auraColor} size={140} className="-top-8 -right-8" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Về chuyên mục {name}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed m-0 font-normal">
                  Phân tích công nghệ, dữ liệu thị trường và thông tin chuyên sâu độc quyền được giám tuyển bởi trí tuệ nhân tạo và ban biên tập MStudio Channel.
                </p>
              </section>

              {/* Navigation Pill Grid */}
              <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 backdrop-blur-xl shadow-xl">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Khám phá chuyên mục khác
                </h3>
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
                      className="px-3.5 py-1.5 bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 hover:bg-cyan-950/80 hover:text-cyan-200 transition-all rounded-full text-xs font-medium text-slate-200 shadow-sm"
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
