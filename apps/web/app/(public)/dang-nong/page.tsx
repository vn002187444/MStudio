import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { fetchTrendingArticles } from "../../../lib/content/articles";
import { CompactNewsCard, LeadStoryCard } from "../../../components/article/news-card";
import { BentoGrid, BentoCard, AmbientGlow } from "@mstudio/ui";

/**
 * Đang nóng (PLAN public route /dang-nong/) — ranking theo reader events
 * thật (pool trending của GET /recommendations). Không có event = trống,
 * không fabricate số liệu.
 */
export const metadata: Metadata = {
  title: "Đang nóng | MStudio Channel",
  description: "Bài đang được đọc nhiều trên MStudio Channel — xếp hạng theo tương tác thật.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${siteOrigin()}/dang-nong`,
  },
};

export default async function TrendingPage() {
  const articles = await fetchTrendingArticles(12);
  const [topArticle, ...restArticles] = articles;

  return (
    <main
      className="home-main relative min-h-screen bg-[#07080B] text-slate-100 pt-6 pb-28 overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(244,63,94,0.18)" size={500} className="-top-40 -left-20 pointer-events-none" />

      <div className="container-content max-w-[var(--container)] mx-auto px-4 relative z-10">
        {/* Page Header */}
        <header className="mb-10 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <span>/</span>
            <span className="text-rose-400 font-bold">Đang nóng</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl md:text-5xl font-black text-white m-0 flex items-center gap-3">
              Tin tức đang nóng 🔥
            </h1>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-950/80 border border-rose-500/40 text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              Tương tác thực tế
            </span>
          </div>

          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed m-0 font-normal">
            Xếp hạng dựa trên tín hiệu tương tác và lượt đọc thực tế của độc giả — minh bạch và không dùng số liệu mô phỏng.
          </p>
        </header>

        {articles.length > 0 ? (
          <BentoGrid>
            {/* Main Column (8 cols): Top Article + List */}
            <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
              {/* #1 Top Article */}
              {topArticle && (
                <section aria-labelledby="top-1-heading" className="relative mb-8">
                  <h2 id="top-1-heading" className="visually-hidden">Bài viết Top 1</h2>
                  <div
                    className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center justify-center text-2xl font-black z-20 shadow-xl border-2 border-white/30"
                    aria-hidden="true"
                  >
                    1
                  </div>
                  <LeadStoryCard article={topArticle} />
                </section>
              )}

              {/* Next Articles List */}
              {restArticles.length > 0 && (
                <section aria-labelledby="trending-rest-heading" className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 md:p-6 backdrop-blur-xl shadow-xl">
                  <h2 id="trending-rest-heading" className="text-lg md:text-xl font-bold text-white mb-5 border-b border-white/10 pb-3 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    Top được đọc nhiều tiếp theo
                  </h2>
                  <div className="flex flex-col gap-4">
                    {restArticles.map((article, index) => {
                      const rank = index + 2;
                      return (
                        <div key={article.id} className="relative pl-6">
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-4 font-mono font-black text-sm text-slate-500"
                          >
                            #{rank}
                          </span>
                          <CompactNewsCard article={article} />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </BentoCard>

            {/* Sidebar Column (4 cols) */}
            <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-rose-400 flex items-center gap-2">
                    <span>📊</span> Thuật toán minh bạch
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    Danh sách xu hướng hoàn toàn không bị thao túng bởi nhà tài trợ. Điểm số bài viết tự động tính toán dựa trên thời gian đọc thực tế và tỷ lệ chia sẻ.
                  </p>
                </div>
                <hr className="border-white/10" />
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Chuyên mục nóng
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {["/ai-channel", "/cong-nghe", "/kinh-doanh", "/goc-toi"].map((path) => (
                      <a
                        key={path}
                        href={path}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        {path.replace("/", "#")}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          </BentoGrid>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-12 text-center shadow-xl">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-base font-bold text-white mb-2">Chưa có đủ tín hiệu xu hướng</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto m-0">
              Hệ thống đang tích lũy số liệu đọc thật trong 24 giờ qua. Bạn có thể xem tin mới tại trang chủ.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
