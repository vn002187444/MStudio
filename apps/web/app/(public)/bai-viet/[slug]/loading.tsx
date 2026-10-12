/**
 * Article loading skeleton (MST-042) — giữ đúng geometry nội dung cuối
 * (PLAN: skeleton preserves final-content geometry, static khi reduced-motion).
 */
export default function ArticleLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải bài viết" className="article-main">
      <div className="skeleton-pulse" style={{ height: 16, width: 120 }} />
      <div className="skeleton-pulse" style={{ height: 40, marginTop: 8 }} />
      <div className="skeleton-pulse" style={{ height: 20, marginTop: 8, width: "70%" }} />
      <div className="skeleton-pulse" style={{ aspectRatio: "16 / 9", marginTop: 24, width: "100%" }} />
      <p role="status" style={{ color: "var(--gray)" }}>Đang tải bài viết…</p>
    </main>
  );
}
