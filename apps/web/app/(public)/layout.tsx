/**
 * Public route group layout (MST-001 foundation).
 * Minimal chrome — full editorial header/nav/sidebar là phạm vi MST-012.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--off-white)",
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          background: "var(--black)",
          color: "var(--white)",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 16,
            margin: "0 auto",
            maxWidth: "var(--max-content-width)",
            padding: "12px 16px",
          }}
        >
          <p style={{ fontWeight: 800, letterSpacing: "0.04em", margin: 0 }}>
            MSTUDIO <span style={{ fontWeight: 400 }}>CHANNEL</span>
          </p>
          <nav aria-label="Chuyên mục chính">
            <ul style={{ display: "flex", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
              <li>Mới nhất</li>
              <li>Đang nóng</li>
              <li>AI Channel</li>
            </ul>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
