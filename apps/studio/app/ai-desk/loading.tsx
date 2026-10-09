/**
 * AI Desk loading state (MST-032).
 */
export default function AiDeskLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải AI desk">
      <div
        style={{ background: "var(--border)", borderRadius: "var(--radius-sm)", height: 32, width: 140 }}
      />
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải AI desk…</p>
    </main>
  );
}
