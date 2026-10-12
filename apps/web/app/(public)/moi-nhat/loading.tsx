/**
 * Mới nhất loading skeleton — giữ geometry, static khi reduced-motion.
 */
export default function LatestLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải feed mới nhất" className="home-main">
      <div
        style={{ background: "var(--border)", borderRadius: "var(--radius-sm)", height: 40, width: 240 }}
      />
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            height: 96,
            marginTop: 16,
          }}
        />
      ))}
      <p role="status" style={{ color: "var(--gray)" }}>
        Đang tải feed mới nhất…
      </p>
    </main>
  );
}
