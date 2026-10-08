import { primaryNav, trendingTopics } from "./taxonomy";

/**
 * Site header (MST-012 editorial shell).
 * - Desktop: sticky header + trending strip + full taxonomy nav.
 * - Mobile: compact bar + menu <details> (native, keyboard-accessible, no JS).
 * Server Component.
 */
export function SiteHeader() {
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
        <nav aria-label="Chuyên mục chính" className="desktop-nav">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mobile-bar">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
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
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
