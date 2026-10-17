import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import {
  CompactNewsCard,
  FeaturedCard,
  LeadStoryCard,
} from "../../components/article/news-card";
import { StoriesRail } from "../../components/navigation/stories-rail";
import { Hero3D, BentoGrid, BentoCard, BentoMarketStrip, cleanText } from "@mstudio/ui";

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

  const heroArticle = articles[0];
  const heroRail = articles.slice(1, 4);
  const featuredStrip = articles.slice(4, 8);
  const mainStream = articles.slice(8);
  const breakingArticle = articles.find((a) => a.isBreaking);

  return (
    <main className="home-main min-h-screen" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — Tạp chí tin tức công nghệ và đa nguồn</h1>

      {/* 3D Hero Section */}
      <section className="relative w-full h-[58vh] min-h-[460px] border-b border-white/10 bg-[var(--void-deep,#080c14)] overflow-hidden">
        <Hero3D className="absolute inset-0" />
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 drop-shadow-2xl">
            Tương Lai Của Tin Tức
          </h2>
          <p className="text-base md:text-lg text-white/80 max-w-2xl font-medium drop-shadow-lg leading-relaxed">
            Khám phá thông tin qua lăng kính công nghệ AI. Dữ liệu thời gian thực, minh bạch nguồn gốc và góc nhìn sâu sắc.
          </p>
        </div>

        {/* Breaking News Floating Ticker */}
        {breakingArticle && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4">
            <aside
              aria-label="Tin nóng khẩn cấp"
              className="glass-shell rounded-full px-4 py-2 flex items-center gap-4 border border-white/20 shadow-2xl bg-slate-900/60 backdrop-blur-xl"
            >
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                TIN NÓNG
              </span>
              <a
                href={`/bai-viet/${breakingArticle.slug || breakingArticle.id}`}
                className="text-white hover:text-cyan-300 font-medium truncate transition-colors text-xs md:text-sm"
              >
                {cleanText(breakingArticle.title)}
              </a>
            </aside>
          </div>
        )}
      </section>

      {/* Stories Rail 24h for Mobile & Fast Glance */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container-content">
          <StoriesRail articles={articles} />
        </div>
      </div>

      {/* Content Section with Solar Light / Hybrid Glass background */}
      <div className="bg-[var(--solar-light,#f8fafc)] dark:bg-[var(--surface-sunlit,#0b0f19)] pt-8 pb-24 transition-colors">
        <div className="container-content max-w-[var(--container)] mx-auto px-4">
          
          {/* Live Market Ticker */}
          <div className="mb-10">
            <BentoMarketStrip />
          </div>

          {/* Master Bento Grid */}
          <BentoGrid className="mb-16">
            {/* Lead Story (Span 8 cols) */}
            <BentoCard colSpan={8} className="p-0 overflow-visible bg-transparent border-none">
              {heroArticle ? (
                <LeadStoryCard article={heroArticle} />
              ) : (
                <div className="h-full flex items-center justify-center p-8 bg-white/50 rounded-[var(--bento-radius-outer)] border border-black/5">
                  <p className="text-gray-500">Đang cập nhật bài viết mới nhất…</p>
                </div>
              )}
            </BentoCard>

            {/* Side Rail (Span 4 cols) */}
            <BentoCard colSpan={4} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-black/5 dark:border-white/10 flex flex-col p-5 rounded-3xl">
              <div className="section-divider-sm px-1 pb-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h3 className="section-label text-base font-bold text-slate-900 dark:text-white">Tiêu điểm</h3>
                <span className="section-meta text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold uppercase tracking-wider">Cập nhật 24/7</span>
              </div>
              <div className="flex flex-col gap-4 mt-4 flex-1 justify-between">
                {heroRail.map((article) => (
                  <CompactNewsCard key={article.id} article={article} />
                ))}
              </div>
            </BentoCard>
          </BentoGrid>

          {/* Featured Bento Strip */}
          {featuredStrip.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Tin nổi bật</h2>
                <a href="/moi-nhat" className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline">
                  Xem tất cả →
                </a>
              </div>
              <BentoGrid>
                {featuredStrip.map((article) => (
                  <BentoCard key={article.id} colSpan={3} className="p-0 border-none bg-transparent">
                    <FeaturedCard article={article} />
                  </BentoCard>
                ))}
              </BentoGrid>
            </section>
          )}

          {/* Deep Catalog Stream */}
          <section className="mt-12">
            <h2 className="text-2xl font-black tracking-tight mb-6 px-1 text-slate-900 dark:text-white">Dòng thời sự</h2>
            
            <BentoGrid>
              {/* Main Stream (8 cols) */}
              <BentoCard colSpan={8} className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-lg border border-black/5 dark:border-white/10 p-5 rounded-3xl">
                <div className="flex flex-col gap-6">
                  {mainStream.length > 0 ? (
                    mainStream.map((article) => (
                      <CompactNewsCard key={article.id} article={article} />
                    ))
                  ) : (
                    <p className="text-gray-500 py-8 text-center text-sm">Đang nạp thêm các bài viết mới…</p>
                  )}
                </div>
              </BentoCard>

              {/* Discovery Sidebar (4 cols) */}
              <BentoCard colSpan={4} className="bg-slate-900/90 dark:bg-slate-950/80 border border-white/10 text-white overflow-hidden p-6 rounded-3xl h-fit shadow-xl">
                <div className="flex flex-col gap-6">
                  {/* Lineage Info */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-cyan-400">
                      <span aria-hidden="true">🛡️</span> Chuẩn mực biên tập
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Mọi bài viết xuất bản đều được tổng hợp đa nguồn, tự động kiểm chứng và truy nguyên nguồn gốc minh bạch với Fact-Check pipeline.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Trending Topics */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3">Chủ đề quan tâm</h3>
                    <div className="flex flex-wrap gap-2">
                      {["#TríTuệNhânTạo", "#BánDẫn", "#TàiChính", "#KhởiNghiệp", "#XeĐiện", "#NăngLượngXanh"].map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-white/5 hover:bg-white/15 transition-colors border border-white/10 rounded-full text-xs font-medium cursor-pointer text-slate-300 hover:text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </BentoCard>
            </BentoGrid>
          </section>

        </div>
      </div>
    </main>
  );
}
