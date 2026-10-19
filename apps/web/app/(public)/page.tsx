import type { PublishedArticleRecord } from "../../lib/contracts";
import { fetchApi } from "../../lib/api";
import {
  CompactNewsCard,
  FeaturedCard,
  LeadStoryCard,
  formatRelativeTime,
  CATEGORY_NAMES,
} from "../../components/article/news-card";
import { StoriesRail } from "../../components/navigation/stories-rail";
import {
  Hero3D,
  BentoGrid,
  BentoCard,
  BentoMarketStrip,
  AIBenchmarkWidget,
  CrisisTimeline,
  ScienceDataBox,
  cleanText,
  AmbientGlow,
} from "@mstudio/ui";
import { HomeStreamClient } from "../../components/widgets/home-stream";

export const dynamic = "force-dynamic";

interface ArticlesResponse {
  rows: PublishedArticleRecord[];
  nextCursor?: { createdAt: string; id: string };
}

async function fetchLatest(limit = 24): Promise<{ rows: PublishedArticleRecord[]; nextCursor?: { createdAt: string; id: string } }> {
  try {
    const response = await fetchApi(`/articles?limit=${limit}`, {
      cache: "no-store",
    });
    if (!response.ok) return { rows: [] };
    const payload = (await response.json()) as ArticlesResponse;
    return {
      rows: Array.isArray(payload.rows) ? payload.rows : [],
      nextCursor: payload.nextCursor,
    };
  } catch {
    return { rows: [] };
  }
}

async function fetchCategory(category: string, limit = 4): Promise<PublishedArticleRecord[]> {
  try {
    const response = await fetchApi(`/articles?category=${encodeURIComponent(category)}&limit=${limit}`, {
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
  const [latestData, techArticles, darkArticles, bizArticles] = await Promise.all([
    fetchLatest(24),
    fetchCategory("cong-nghe", 4),
    fetchCategory("goc-toi", 4),
    fetchCategory("kinh-doanh", 4),
  ]);

  const articles = latestData.rows;
  const heroArticle = articles[0];
  const centerSubArticles = articles.slice(1, 3);
  const fastStreamArticles = articles.slice(3, 7);
  const editorialArticles = articles.slice(7, 10);
  const featuredStrip = articles.slice(10, 14);
  const mainStream = articles.slice(14);
  const breakingArticle = articles.find((a) => a.isBreaking);

  return (
    <main className="home-main min-h-screen bg-[#07080B] text-slate-100 relative overflow-hidden" id="main-content">
      <h1 className="visually-hidden">MStudio Channel — Tạp chí tin tức công nghệ và đa nguồn</h1>

      {/* ── Ambient Tech Canvas: Hero3D Background for Above-The-Fold ── */}
      <div className="absolute inset-x-0 top-0 h-[920px] pointer-events-none opacity-25 md:opacity-30 z-0 overflow-hidden" aria-hidden="true">
        <Hero3D className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07080B]/60 to-[#07080B]" />
      </div>

      {/* Ambient Optical Glows */}
      <AmbientGlow color="rgba(37,99,235,0.18)" size={650} className="-top-32 -left-32 pointer-events-none" />
      <AmbientGlow color="rgba(6,182,212,0.14)" size={550} className="top-1/4 -right-32 pointer-events-none" />
      <AmbientGlow color="rgba(168,85,247,0.12)" size={550} className="top-2/3 -left-40 pointer-events-none" />

      {/* ── Stories Rail (Optimized for Mobile/Tablet Quick Glance) ── */}
      <div className="lg:hidden border-b border-white/10 bg-slate-950/70 backdrop-blur-md relative z-10">
        <div className="container-content max-w-[var(--container)] mx-auto">
          <StoriesRail articles={articles} />
        </div>
      </div>

      <div className="relative z-10 pt-4 md:pt-6 pb-24">
        <div className="container-content max-w-[var(--container)] mx-auto px-4 space-y-12">
          
          {/* ── 0. Live Financial Ticker Strip (VN30, Global 30, Top 20 Crypto) ── */}
          <div className="w-full">
            <BentoMarketStrip />
          </div>

          {/* ── 1. Master 3-Column Bento Grid (Above-the-fold: 3 - 6 - 3 cols) ── */}
          <section aria-label="Khu vực tin chính">
            <BentoGrid className="items-stretch">
              
              {/* ── Cột Trái (3 cols / 25%): Tin nóng, Tin nhanh 24/7, AI Benchmark mini ── */}
              <BentoCard
                colSpan={3}
                className="order-2 lg:order-1 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Breaking News Banner (if present) */}
                  {breakingArticle && (
                    <aside
                      aria-label="Tin nóng khẩn cấp"
                      className="rounded-2xl p-3.5 bg-gradient-to-r from-rose-950/80 to-slate-900/90 border border-rose-500/40 shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
                          TIN NÓNG
                        </span>
                        <span className="text-[10px] text-rose-300 font-mono font-medium ml-auto">
                          {formatRelativeTime(breakingArticle.updatedAt)}
                        </span>
                      </div>
                      <a
                        href={`/bai-viet/${breakingArticle.slug || breakingArticle.id}`}
                        className="text-xs font-bold text-white hover:text-rose-200 line-clamp-2 transition-colors block mt-1"
                      >
                        {cleanText(breakingArticle.title)}
                      </a>
                    </aside>
                  )}

                  {/* Realtime Fast News Stream */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                          Tin Nhanh 24/7
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400/80 uppercase font-semibold">
                        Realtime
                      </span>
                    </div>

                    <div className="space-y-2">
                      {fastStreamArticles.map((art) => (
                        <article
                          key={art.id}
                          className="group/item flex flex-col gap-1 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                            <span className="text-cyan-400 font-bold">
                              {formatRelativeTime(art.updatedAt)}
                            </span>
                            {art.categorySlug && (
                              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                                {CATEGORY_NAMES[art.categorySlug] || art.categorySlug}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-slate-200 group-hover/item:text-cyan-300 line-clamp-2 transition-colors leading-snug">
                            <a href={`/bai-viet/${art.slug || art.id}`}>
                              {cleanText(art.title)}
                            </a>
                          </h4>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Benchmark Mini Widget */}
                <div className="pt-2">
                  <AIBenchmarkWidget
                    title="AI Benchmark 2026"
                    className="!p-4 border-cyan-500/30"
                  />
                </div>
              </BentoCard>

              {/* ── Cột Giữa (6 cols / 50%): Lead Story 16:9 + 2 Featured Sub-Cards ── */}
              <BentoCard
                colSpan={6}
                className="order-1 lg:order-2 p-0 overflow-visible bg-transparent border-none flex flex-col justify-between"
              >
                {/* Primary Lead Story Card */}
                {heroArticle ? (
                  <LeadStoryCard article={heroArticle} layout="vertical" />
                ) : (
                  <div className="h-full flex items-center justify-center p-8 bg-slate-900/60 rounded-[var(--bento-radius-outer)] border border-white/10">
                    <p className="text-slate-400">Đang cập nhật bài viết mới nhất…</p>
                  </div>
                )}

                {/* 2 Sub-Featured Cards below Lead Story for rich editorial density */}
                {centerSubArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {centerSubArticles.map((article) => (
                      <FeaturedCard key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </BentoCard>

              {/* ── Cột Phải (3 cols / 25%): Tiêu điểm biên tập, Quick tags, Crisis Timeline ── */}
              <BentoCard
                colSpan={3}
                className="order-3 lg:order-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Tiêu Điểm Biên Tập
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      Tuyển chọn
                    </span>
                  </div>

                  <div className="flex flex-col divide-y divide-white/5">
                    {editorialArticles.map((art) => (
                      <CompactNewsCard key={art.id} article={art} showThumbnail={false} />
                    ))}
                  </div>
                </div>

                {/* Category Fast Access Shortcuts */}
                <div className="pt-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
                    Chuyên mục nhanh
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <a
                      href="/chuyen-muc/cong-nghe"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 transition-colors"
                    >
                      #CôngNghệ
                    </a>
                    <a
                      href="/chuyen-muc/goc-toi"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:bg-purple-900 transition-colors"
                    >
                      #GócTối
                    </a>
                    <a
                      href="/chuyen-muc/kinh-doanh"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition-colors"
                    >
                      #KinhDoanh
                    </a>
                    <a
                      href="/chuyen-muc/blockchain"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 hover:bg-amber-900 transition-colors"
                    >
                      #Blockchain
                    </a>
                  </div>
                </div>

                {/* Crisis Timeline Live Briefing */}
                <CrisisTimeline className="!p-4 border-amber-500/30" title="Diễn biến nóng 24h" />
              </BentoCard>

            </BentoGrid>
          </section>

          {/* ── 2. Spotlight Hub: 3 Cột Chuyên Đề Cân Đối (4 - 4 - 4 cols) ── */}
          <section className="mt-14" aria-label="Chuyên đề tiêu điểm">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  <span className="text-cyan-400">⚡</span> Chuyên Đề Tiêu Điểm
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Phân tích chuyên sâu từ các luồng dữ liệu độc quyền đa nguồn
                </p>
              </div>
              <a
                href="/chuyen-muc/cong-nghe"
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Tất cả chuyên mục →
              </a>
            </div>

            <BentoGrid>
              {/* Column 1: Công Nghệ & AI Frontier */}
              <BentoCard
                colSpan={4}
                className="spotlight-card bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-5 rounded-3xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <span>🤖</span> Công nghệ & AI
                    </span>
                    <a href="/chuyen-muc/cong-nghe" className="text-[11px] font-bold text-slate-400 hover:text-cyan-300">
                      Xem thêm →
                    </a>
                  </div>

                  <ScienceDataBox
                    label="Đột phá Lượng tử 2026"
                    metric="1,000,000"
                    unit="Qubits logic"
                    description="Kiến trúc bẫy ion thế hệ mới đạt ngưỡng chịu lỗi thực nghiệm, mở ra kỷ nguyên điện toán tối ưu."
                    className="mb-4 !p-4 border-cyan-500/30"
                  />

                  <div className="space-y-3">
                    {techArticles.slice(0, 3).map((art) => (
                      <div key={art.id} className="group border-b border-white/5 pb-2.5 last:border-b-0">
                        <a
                          href={`/bai-viet/${art.slug || art.id}`}
                          className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors"
                        >
                          {cleanText(art.title)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </BentoCard>

              {/* Column 2: Góc Tối & Hồ Sơ Điều Tra */}
              <BentoCard
                colSpan={4}
                className="spotlight-card bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 p-5 rounded-3xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <span>🌌</span> Góc Tối & Kỳ Án
                    </span>
                    <a href="/chuyen-muc/goc-toi" className="text-[11px] font-bold text-slate-400 hover:text-purple-300">
                      Xem thêm →
                    </a>
                  </div>

                  <div className="rounded-2xl p-4 bg-purple-950/50 border border-purple-500/30 mb-4">
                    <div className="text-[11px] text-purple-300 font-bold uppercase tracking-widest mb-1">
                      Hồ Sơ Tuyệt Mật
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      Phóng sự điều tra độc quyền, tội phạm mạng tinh vi, giải mã các hồ sơ đại án và ký sự tư liệu có xác thực.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {darkArticles.length > 0 ? (
                      darkArticles.slice(0, 3).map((art) => (
                        <div key={art.id} className="group border-b border-white/5 pb-2.5 last:border-b-0">
                          <a
                            href={`/bai-viet/${art.slug || art.id}`}
                            className="text-xs font-bold text-slate-200 group-hover:text-purple-300 line-clamp-2 transition-colors"
                          >
                            {cleanText(art.title)}
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        Đang nạp các hồ sơ điều tra mới nhất…
                      </p>
                    )}
                  </div>
                </div>
              </BentoCard>

              {/* Column 3: Kinh Doanh & Thị Trường */}
              <BentoCard
                colSpan={4}
                className="spotlight-card bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 p-5 rounded-3xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span>📈</span> Kinh Doanh & Thị Trường
                    </span>
                    <a href="/chuyen-muc/kinh-doanh" className="text-[11px] font-bold text-slate-400 hover:text-emerald-300">
                      Xem thêm →
                    </a>
                  </div>

                  <div className="rounded-2xl p-4 bg-emerald-950/40 border border-emerald-500/30 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-widest">
                        Nhịp Đập Kinh Tế
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">VN-Index +1.2%</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      Dòng tiền khối ngoại luân chuyển mạnh vào nhóm bán dẫn, hạ tầng số và năng lượng tái tạo chu kỳ mới.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {bizArticles.slice(0, 3).map((art) => (
                      <div key={art.id} className="group border-b border-white/5 pb-2.5 last:border-b-0">
                        <a
                          href={`/bai-viet/${art.slug || art.id}`}
                          className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 line-clamp-2 transition-colors"
                        >
                          {cleanText(art.title)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </BentoCard>
            </BentoGrid>
          </section>

          {/* ── 3. Featured Bento Strip: Tin Nổi Bật Tuyển Chọn ── */}
          {featuredStrip.length > 0 && (
            <section className="mt-14" aria-label="Tin nổi bật">
              <div className="flex items-center justify-between mb-6 px-1">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">Tin nổi bật</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Tuyển chọn các sự kiện quan trọng và phân tích đa chiều trong ngày
                  </p>
                </div>
                <a href="/moi-nhat" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline">
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

          {/* ── 4. Deep Catalog Stream with Infinite Load More (8 - 4 cols) ── */}
          <section className="mt-14" aria-label="Dòng thời sự trực tiếp">
            <div className="flex items-center justify-between mb-6 px-1">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Dòng thời sự trực tiếp</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Luồng thông tin liên tục được cập nhật theo thời gian thực
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/70 border border-cyan-500/40 px-3 py-1 rounded-full">
                {articles.length} bài đã nạp
              </span>
            </div>

            <BentoGrid>
              {/* Main Stream (8 cols) */}
              <BentoCard colSpan={8} className="stream-main-card bg-slate-900/90 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-xl">
                <HomeStreamClient
                  initialArticles={mainStream}
                  initialCursor={latestData.nextCursor}
                />
              </BentoCard>

              {/* Discovery Sidebar (4 cols) */}
              <BentoCard colSpan={4} className="stream-side-card bg-slate-900/90 border border-white/10 text-white overflow-hidden p-6 rounded-3xl h-fit shadow-xl space-y-6">
                {/* Editorial Lineage Info */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 text-cyan-400">
                    <span aria-hidden="true">🛡️</span> Chuẩn mực biên tập
                  </h3>
                  <p className="text-slate-300 text-xs leading-relaxed font-normal">
                    Mọi bài viết xuất bản đều được tổng hợp đa nguồn, tự động kiểm chứng và truy nguyên nguồn gốc minh bạch với Fact-Check pipeline.
                  </p>
                </div>

                <hr className="border-white/10" />

                {/* Trending Topics */}
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Chủ đề quan tâm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["#TríTuệNhânTạo", "#BánDẫn", "#Blockchain", "#GócTối", "#TàiChính", "#KhởiNghiệp", "#XeĐiện", "#NăngLượngXanh"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-slate-800/90 hover:bg-cyan-950/80 transition-colors border border-slate-700/80 hover:border-cyan-500/50 rounded-full text-xs font-medium cursor-pointer text-slate-200 hover:text-cyan-300 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-white/10" />

                {/* System Specs Status Box */}
                <div className="system-status-box rounded-2xl p-4 bg-slate-950/60 border border-white/10 text-[11px] font-mono text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Phiên bản:</span>
                    <span className="text-cyan-400 font-bold">v2.0 Hybrid Glassmorphic</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Độ trễ:</span>
                    <span className="text-emerald-400 font-bold">&lt; 15ms (Edge)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kiểm chứng:</span>
                    <span className="text-white font-bold">100% LLM Automated</span>
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
