/**
 * Overview loading state.
 */
export default function OverviewLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải overview">
      <div
        style={{ background: "var(--border)", borderRadius: "var(--radius-sm)", height: 32, width: 160 }}
      />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", marginTop: 16 }}>
        {[0, 1, 2, 3].map((card) => (
          <div
            key={card}
            style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", height: 104 }}
          />
        ))}
      </div>
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải overview…</p>
    </main>
  );
}
