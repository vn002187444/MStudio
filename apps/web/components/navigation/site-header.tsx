import { fetchPrimaryNav, trendingTopics } from "./taxonomy";

/**
 * Site header (MST-012 editorial shell).
 * - Desktop: sticky header + trending strip + full taxonomy nav.
 * - Mobile: compact bar + menu <details> (native, keyboard-accessible, no JS).
 * - Nav items từ DB (MST-072), fallback hardcode khi API lỗi.
 * Server Component.
 */
export async function SiteHeader() {
  const primaryNav = await fetchPrimaryNav();
  return (
    <header className="site-header">
      <div className="trending-strip">
        <p className="trending-label">Đang nóng</p>
        <nav aria-label="Chủ đề đang nóng">
          <ul className="trending-list">
            {trendingTopics.map((topic) => (
              <li key={topic.href}>
                <a href={topic.href}>{topic.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="desktop-bar">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
        </a>
        <nav aria-label="Chuyên mục chính" className="desktop-nav" style={{ flex: 1 }}>
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="/cms"
          target="_blank"
          rel="noopener noreferrer"
          className="header-cms-btn"
          title="Truy cập Cổng Biên tập Studio CMS"
        >
          <span aria-hidden="true">✍️</span>
          <span>Biên tập / CMS</span>
        </a>
      </div>

      <div className="mobile-bar">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="/cms"
            target="_blank"
            rel="noopener noreferrer"
            className="header-cms-btn header-cms-btn--mobile"
            title="Biên tập CMS"
          >
            <span aria-hidden="true">✍️</span>
            <span>CMS</span>
          </a>
          <details className="mobile-menu">
            <summary aria-label="Mở menu chuyên mục">Menu</summary>
            <nav aria-label="Chuyên mục (di động)">
              <ul>
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
                <li style={{ borderTop: "1px solid var(--ink-800)", paddingTop: 4, marginTop: 4 }}>
                  <a href="/cms" target="_blank" rel="noopener noreferrer" style={{ color: "#93c5fd" }}>
                    ✍️ Cổng Biên tập viên / Studio CMS
                  </a>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
