/**
 * Article loading skeleton (MST-042) — Hybrid Glassmorphic Skeleton
 */
export default function ArticleLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Đang tải bài viết"
      className="min-h-screen bg-[#07080B] text-slate-100 max-w-4xl mx-auto px-4 py-12"
    >
      <div className="h-6 w-32 bg-slate-800/80 rounded-full animate-pulse mb-6" />
      <div className="h-12 w-full bg-slate-800/60 rounded-xl animate-pulse mb-4" />
      <div className="h-12 w-3/4 bg-slate-800/60 rounded-xl animate-pulse mb-8" />
      <div className="aspect-video w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl animate-pulse mb-8" />
      <div className="space-y-4">
        <div className="h-4 w-full bg-slate-800/40 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-800/40 rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-slate-800/40 rounded animate-pulse" />
      </div>
      <p role="status" className="mt-8 text-sm text-slate-400">
        Đang tải bài viết…
      </p>
    </main>
  );
}
