/**
 * Shared entity/topic template (MST-051) — dùng cho chủ đề, nhân vật,
 * tổ chức, quốc gia. Dữ liệu entity thật khi backend mở endpoint.
 */
export function EntityTemplate({
  kindLabel,
  name,
  description,
}: {
  kindLabel: string;
  name: string;
  description: string;
}) {
  return (
    <main className="home-main" id="main-content">
      <p style={{ color: "var(--gray)", margin: "0 0 4px" }}>{kindLabel}</p>
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>{name}</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>{description}</p>
      <section aria-labelledby="entity-articles-heading">
        <h2 id="entity-articles-heading">Bài viết liên quan</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Bài viết gắn entity này sẽ hiển thị khi có dữ liệu xuất bản và liên kết nội bộ (MST-050).
        </p>
      </section>
    </main>
  );
}
