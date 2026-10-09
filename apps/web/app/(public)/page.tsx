/**
 * MStudio Channel — trang chủ public (MST-001 foundation placeholder).
 * Server Component. Nội dung biên tập đầy đủ thuộc về MST-012 / MST-042.
 */
const sections = [
  "Thế giới",
  "Công nghệ",
  "AI Channel",
  "Giải trí",
  "Khám phá",
  "Đời sống",
  "Góc Tối",
];

export default function PublicHomePage() {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "var(--max-content-width)",
        padding: "32px 16px",
      }}
    >
      <h1 style={{ fontSize: 32, lineHeight: 1.25, margin: "0 0 8px" }}>
        MStudio Channel
      </h1>
      <p style={{ color: "var(--gray)", margin: "0 0 24px" }}>
        Nền tảng tin tức evidence-first — web foundation (MST-001) đã boot thành công.
      </p>
      <nav aria-label="Chuyên mục">
        <ul
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {sections.map((section) => (
            <li
              key={section}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
              }}
            >
              {section}
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
