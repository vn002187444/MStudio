import type { Metadata } from "next";
import { parseSearchQuery } from "../../../lib/validation";

/**
 * Search UX (MST-051) — form GET giữ state trong URL (?q=), server-rendered.
 * noindex: trang kết quả tìm kiếm không cho index. Phân trang keyset sẵn sàng
 * khi backend mở endpoint search (hiện render empty state trung thực).
 */
export const metadata: Metadata = {
  title: "Tìm kiếm | MStudio Channel",
  description: "Tìm kiếm bài viết, chủ đề, nhân vật trên MStudio Channel.",
  robots: { index: false, follow: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const rawQuery = params.q ?? "";
  const query = parseSearchQuery(rawQuery) ?? "";
  const queryTooLong =
    typeof rawQuery === "string" && rawQuery.trim().length > 200;

  return (
    <main className="home-main min-h-screen bg-[#07080B] text-slate-100 max-w-4xl mx-auto px-4 py-12" id="main-content">
      <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Tìm kiếm</h1>
      <form action="/search" method="get" role="search" className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl">
        <label htmlFor="search-query" className="block text-sm font-semibold text-slate-300 mb-2">
          Từ khóa tìm kiếm
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            autoComplete="off"
            defaultValue={query}
            id="search-query"
            name="q"
            placeholder="Nhập chủ đề, từ khóa hoặc tiêu đề bài viết…"
            spellCheck={false}
            className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-base"
            type="search"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all text-base shrink-0"
          >
            Tìm kiếm
          </button>
        </div>
      </form>

      <section aria-labelledby="search-results-heading" className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 mt-8 shadow-xl">
        <h2 id="search-results-heading" className="text-xl font-bold text-white mb-4">Kết quả</h2>
        {query === "" ? (
          <p role="status" className="text-slate-400 text-base m-0">
            {queryTooLong
              ? "Từ khóa quá dài (tối đa 200 ký tự) — rút ngắn rồi tìm lại."
              : "Nhập từ khóa ở trên để tìm kiếm bài viết trong hệ thống."}
          </p>
        ) : (
          <p role="status" className="text-slate-400 text-base m-0">
            Chưa có kết quả cho “<span className="text-cyan-300 font-semibold">{query}</span>” — search backend sẽ nối ở giai đoạn discovery.
          </p>
        )}
      </section>
    </main>
  );
}
