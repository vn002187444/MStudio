import type { PublishedArticleRecord } from "../../lib/contracts";
import { apiBaseUrl, fetchApi } from "../../lib/api";
import {
  CompactNewsCard,
  FeaturedCard,
  LeadStoryCard,
} from "../../components/article/news-card";
import { Hero3D, BentoGrid, BentoCard, cleanText } from "@mstudio/ui";

/**
 * Trang chủ Editorial News & Minimal Data UI (MST-110 Hybrid Glassmorphic Portal).
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
    <main className="home-main min-h-screen" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — Tạp chí tin tức công nghệ và đa nguồn</h1>

      {/* 3D Hero Section */}
      <section className="relative w-full h-[60vh] min-h-[500px] border-b border-white/10 bg-[var(--void-deep)] overflow-hidden">
        <Hero3D className="absolute inset-0" />
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 drop-shadow-2xl">
            Tương Lai Của Tin Tức
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl font-medium drop-shadow-lg">
            Khám phá thông tin qua lăng kính công nghệ AI. Dữ liệu thời gian thực, minh bạch nguồn gốc và góc nhìn sâu sắc.
          </p>
        </div>

        {/* Breaking News Floating Ticker */}
        {breakingArticle && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4">
            <aside
              aria-label="Tin nóng khẩn cấp"
              className="glass-shell rounded-full px-4 py-2 flex items-center gap-4 border border-white/20 shadow-2xl"
            >
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0">
                TIN NÓNG
              </span>
              <a
                href={`/bai-viet/${breakingArticle.slug || breakingArticle.id}`}
                className="text-white hover:text-blue-300 font-semibold truncate transition-colors"
              >
                {cleanText(breakingArticle.title)}
              </a>
            </aside>
          </div>
        )}
      </section>

      {/* Content Section with Solar Light background */}
      <div className="bg-[var(--solar-light)] pt-16 pb-24">
        <div className="container-content">
          
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
            <BentoCard colSpan={4} className="bg-white/80 backdrop-blur-xl border border-black/5 flex flex-col">
              <div className="section-divider-sm px-2">
                <h3 className="section-label text-lg font-bold">Tiêu điểm</h3>
                <span className="section-meta text-xs text-blue-600 font-semibold uppercase tracking-wider">Cập nhật liên tục</span>
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
            <section className="mb-20">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-bold tracking-tight">Tin nổi bật</h2>
                <a href="/moi-nhat" className="text-sm font-semibold text-blue-600 hover:underline">
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
          <section className="mt-16">
            <h2 className="text-3xl font-bold tracking-tight mb-8 px-2">Dòng thời sự</h2>
            
            <BentoGrid>
              {/* Main Stream (8 cols) */}
              <BentoCard colSpan={8} className="bg-white/90 backdrop-blur-lg border border-black/5">
                <div className="flex flex-col gap-6">
                  {mainStream.length > 0 ? (
                    mainStream.map((article) => (
                      <CompactNewsCard key={article.id} article={article} />
                    ))
                  ) : (
                    <p className="text-gray-500 py-8 text-center">Đang nạp thêm các bài viết mới…</p>
                  )}
                </div>
              </BentoCard>

              {/* Discovery Sidebar (4 cols) */}
              <BentoCard colSpan={4} className="bg-[var(--void-surface)] border-none text-white overflow-hidden p-0 h-fit">
                <div className="glass-shell p-[var(--bento-padding)] flex flex-col gap-8 h-full">
                  {/* Lineage Info */}
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span aria-hidden="true">🛡️</span> Chuẩn mực biên tập
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      Mọi bài viết xuất bản đều được tổng hợp đa nguồn, tự động kiểm chứng và truy nguyên nguồn gốc minh bạch với Fact-Check pipeline.
                    </p>
                  </div>

                  <hr className="border-white/10" />

                  {/* Trending Topics */}
                  <div className="relative z-10">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Chủ đề quan tâm</h3>
                    <div className="flex flex-wrap gap-2">
                      {["#TríTuệNhânTạo", "#BánDẫn", "#TàiChính", "#KhởiNghiệp", "#XeĐiện", "#NăngLượngXanh"].map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors border border-white/10 rounded-full text-xs font-medium cursor-pointer">
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
