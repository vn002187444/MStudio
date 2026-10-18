/**
 * Đang nóng loading skeleton — giữ geometry, static khi reduced-motion.
 */
export default function TrendingLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải feed đang nóng" className="home-main min-h-screen bg-[#07080B] text-slate-100 max-w-[var(--max-content-width,1280px)] mx-auto px-4 py-8">
      <div
        className="bg-slate-800 rounded-lg h-10 w-60 animate-pulse"
      />
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="bg-slate-900/90 border border-white/10 rounded-2xl h-24 mt-4 animate-pulse"
        />
      ))}
      <p role="status" className="text-slate-400 mt-4 text-sm">
        Đang tải ranking…
      </p>
    </main>
  );
}
