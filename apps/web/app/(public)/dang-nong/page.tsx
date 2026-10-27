import type { Metadata } from "next";
import { siteOrigin } from "../../../lib/seo";
import { fetchTrendingArticles } from "../../../lib/content/articles";
import { CompactNewsCard, LeadStoryCard } from "../../../components/article/news-card";

/**
 * Đang nóng (PLAN public route /dang-nong/) — ranking theo reader events
 * thật (pool trending của GET /recommendations). Không có event = trống,
 * không fabricate số liệu.
 */
export const metadata: Metadata = {
  title: "Đang nóng | MStudio Channel",
  description: "Bài đang được đọc nhiều trên MStudio Channel — xếp hạng theo tương tác thật.",
};

export default async function TrendingPage() {
  const articles = await fetchTrendingArticles(8);
  const [topArticle, ...restArticles] = articles;

  return (
    <main
      className="home-main min-h-screen bg-[#07080B] text-slate-100 max-w-7xl mx-auto px-4 pt-6 pb-20"
      id="main-content"
    >
      {/* Page Header */}
      <header className="border-b border-white/10 pb-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <a href="/" className="text-slate-400 hover:text-white text-xs transition-colors">Trang chủ</a>
          <span className="text-slate-600 text-xs">/</span>
          <span className="text-cyan-400 text-xs font-semibold">Đang nóng</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white m-0 mb-3 flex items-center gap-3">
          Tin tức đang nóng 🔥
        </h1>
        <p className="text-slate-300 text-sm md:text-base m-0 max-w-2xl bg-slate-900/90 py-2.5 px-4 rounded-xl border border-white/10 inline-block font-normal">
          Xếp hạng dựa trên tín hiệu tương tác và lượt đọc thực tế của độc giả — minh bạch và không dùng số liệu mô phỏng.
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="col-span-12 max-w-3xl mx-auto w-full">
            
            {/* #1 Top Article */}
            {topArticle ? (
              <section aria-labelledby="top-1-heading" className="relative mb-10">
                <h2 id="top-1-heading" className="visually-hidden">Bài viết Top 1</h2>
                <div
                  className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center justify-center text-2xl font-black z-20 shadow-xl border-2 border-white/30"
                  aria-hidden="true"
                >
                  1
                </div>
                <LeadStoryCard article={topArticle} />
              </section>
            ) : null}

            {/* #2 - #8 Articles */}
            {restArticles.length > 0 ? (
              <section aria-labelledby="trending-rest-heading">
                <h2 id="trending-rest-heading" className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                  Top được đọc nhiều tiếp theo
                </h2>
                <ol className="list-none m-0 p-0 flex flex-col gap-4">
                  {restArticles.map((article, index) => {
                    const rank = index + 2;
                    return (
                      <li 
                        key={article.id} 
                        className="relative bg-slate-900/90 rounded-2xl border border-white/10 p-4 pl-16 shadow-lg hover:border-cyan-500/40 transition-colors"
                      >
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 left-4 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow ${
                            rank <= 3
                              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-extrabold border border-cyan-400/50 shadow-cyan-500/30"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                          aria-hidden="true"
                        >
                          {rank}
                        </div>
                        <CompactNewsCard article={article} />
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}

          </div>
        </div>
      ) : (
        <section aria-labelledby="empty-state-heading" className="text-center py-16 px-6 bg-slate-900/90 rounded-2xl border border-white/10 shadow-xl">
          <h2 id="empty-state-heading" className="visually-hidden">Chưa có bài viết</h2>
          <p className="text-slate-400 m-0 mb-4 text-base">
            Chưa đủ tín hiệu đọc để xếp hạng.
          </p>
          <a
            href="/moi-nhat"
            className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            Xem tin mới nhất
          </a>
        </section>
      )}
    </main>
  );
}
