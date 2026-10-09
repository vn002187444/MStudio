/**
 * Category template demo (MST-042) — dùng cho AI Channel trước, các vertical
 * khác tái sử dụng khi có dữ liệu xuất bản (MST-041).
 */
export function CategoryTemplate({ name, description }: { name: string; description: string }) {
  return (
    <main className="home-main" id="main-content">
      <p style={{ color: "var(--gray)", margin: "0 0 4px" }}>Chuyên mục</p>
      <h1 style={{ fontSize: "var(--text-4xl)", margin: "0 0 8px" }}>{name}</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>{description}</p>
      <section aria-labelledby="category-latest-heading">
        <h2 id="category-latest-heading">Mới nhất</h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Bài viết của chuyên mục sẽ hiển thị khi có nội dung xuất bản (MST-041).
        </p>
      </section>
    </main>
  );
}
