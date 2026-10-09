/**
 * Editor loading state (MST-040).
 */
export default function EditorLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải editor">
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải editor…</p>
    </main>
  );
}
