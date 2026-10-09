/**
 * Research Desk loading state (MST-022).
 */
export default function ResearchLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải research desk">
      <div
        style={{ background: "var(--border)", borderRadius: "var(--radius-sm)", height: 32, width: 180 }}
      />
      <div className="desk-grid" style={{ marginTop: 16 }}>
        {[0, 1, 2].map((pane) => (
          <div
            key={pane}
            style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", height: 160 }}
          />
        ))}
      </div>
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải research desk…</p>
    </main>
  );
}
