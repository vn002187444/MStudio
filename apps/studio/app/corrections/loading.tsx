/**
 * Corrections loading state.
 */
export default function CorrectionsLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải corrections">
      <div
        style={{ background: "var(--border)", borderRadius: "var(--radius-sm)", height: 32, width: 160 }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", height: 72 }}
          />
        ))}
      </div>
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải corrections…</p>
    </main>
  );
}
