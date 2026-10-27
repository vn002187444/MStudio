import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { fetchLatestArticles } from "../../../lib/content/articles";
import { CompactNewsCard, LeadStoryCard } from "../../../components/article/news-card";
import { BentoGrid, BentoCard, AmbientGlow } from "@mstudio/ui";

export const metadata: Metadata = {
  title: "Mới nhất | MStudio Channel",
  description: "Tin mới nhất từ MStudio Channel — cập nhật liên tục từ pipeline biên tập.",
};

export default async function LatestPage() {
  const articles = await fetchLatestArticles(20);
  const [heroArticle, ...restArticles] = articles;

  return (
    <main
      className="home-main relative min-h-screen bg-[#07080B] text-slate-100 pt-6 pb-28 overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(37,99,235,0.2)" size={500} className="-top-40 -left-20 pointer-events-none" />

      <div className="container-content max-w-[var(--container)] mx-auto px-4 relative z-10">
        {/* Header */}
        <header className="mb-10 rounded-3xl border border-white/10 bg-slate-900/80 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <a href="/" className="hover:text-white transition-colors">Trang chủ</a>
            <span>/</span>
            <span className="text-slate-400">Dòng sự kiện</span>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Mới nhất</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white m-0 flex items-center gap-3">
              Dòng tin mới nhất
            </h1>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Cập nhật liên tục 24/7
            </span>
          </div>

          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed m-0 font-normal">
            {articles.length > 0
              ? `Hiển thị ${articles.length} bài viết mới nhất được xuất bản và kiểm chứng nguồn bởi ban biên tập.`
              : "Chưa có bài viết mới."}
          </p>
        </header>

        {articles.length > 0 ? (
          <BentoGrid>
            {/* Main Column (8 Columns) */}
            <BentoCard colSpan={8} className="p-0 border-none bg-transparent">
              {heroArticle && (
                <div className="mb-8">
                  <LeadStoryCard article={heroArticle} />
                </div>
              )}

              {restArticles.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 md:p-6 backdrop-blur-xl shadow-xl">
                  <h2 className="text-lg md:text-xl font-bold mb-5 flex items-center gap-2 border-b border-white/10 pb-3 text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    Dòng thời gian
                  </h2>
                  <div className="flex flex-col gap-4">
                    {restArticles.map((article) => (
                      <CompactNewsCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}
            </BentoCard>

            {/* Sidebar Column (4 Columns) */}
            <BentoCard colSpan={4} className="p-0 border-none bg-transparent">
              <div className="flex flex-col gap-6 sticky top-24">
                <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-white/10">
                    Chuyên mục tiêu điểm
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Công nghệ", href: "/cong-nghe" },
                      { label: "AI Channel", href: "/ai-channel" },
                      { label: "Kinh doanh", href: "/kinh-doanh" },
                      { label: "Thời sự", href: "/thoi-su" },
                      { label: "Khoa học", href: "/khoa-hoc" },
                      { label: "Thế giới", href: "/the-gioi" },
                      { label: "Xe", href: "/xe" },
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

                <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
                    🛡️ Tự động kiểm chứng
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed m-0 font-normal">
                    Mọi nguồn cấp dữ liệu đều qua Fact-Check Pipeline tự động đối chiếu chéo để đảm bảo tính xác thực cao nhất trước khi xuất bản.
                  </p>
                </section>
              </div>
            </BentoCard>
          </BentoGrid>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-12 text-center shadow-xl">
            <p className="text-slate-400 text-sm">Đang nạp dữ liệu dòng sự kiện mới nhất...</p>
          </div>
        )}
      </div>
    </main>
  );
}
