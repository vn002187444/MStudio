/**
 * Mới nhất loading skeleton — giữ geometry, static khi reduced-motion.
 */
export default function LatestLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải feed mới nhất" className="home-main min-h-screen bg-[#07080B] text-slate-100 max-w-7xl mx-auto px-4 py-8">
      <div
        className="bg-slate-800 rounded-lg h-10 w-60 animate-pulse"
      />
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="bg-slate-900/90 border border-white/10 rounded-2xl h-24 mt-4 animate-pulse"
        />
      ))}
      <p role="status" className="text-slate-400 mt-4 text-sm">
        Đang tải feed mới nhất…
      </p>
    </main>
  );
}
