import { fetchPrimaryNav, trendingTopics } from "./taxonomy";

/**
 * Site header (MST-012 editorial shell).
 * - Frosted Glass effect: backdrop-filter blur(16px) saturate(180%) + rgba(9, 9, 9, 0.85).
 * - Header height: 72px desktop / 56px mobile (PLAN.md).
 * - Desktop: sticky header + full taxonomy nav + search icon + CMS button.
 * - Trending strip: đặt bên dưới thanh điều hướng chính (PLAN.md).
 * - Mobile: compact bar + menu <details> (native, keyboard-accessible, no JS).
 * - Nav items từ DB (MST-072), fallback hardcode khi API lỗi.
 * Server Component.
 */
export async function SiteHeader() {
  const primaryNav = await fetchPrimaryNav();

  return (
    <header className="site-header frosted-glass bg-black/85">
      {/* Desktop Main Navigation Bar (72px) */}
      <div className="desktop-bar h-[72px]">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
        </a>

        <nav aria-label="Chuyên mục chính" className="desktop-nav flex-1">
          <ul>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/tim-kiem"
            className="header-search"
            aria-label="Tìm kiếm bài viết"
            title="Tìm kiếm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </a>

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
      </div>

      {/* Mobile Bar (56px) */}
      <div className="mobile-bar h-[56px]">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
        </a>

        <div className="flex items-center gap-2">
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
                <li className="border-t border-[var(--ink-800)] pt-1 mt-1">
                  <a
                    href="/cms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:underline"
                  >
                    ✍️ Cổng Biên tập viên / Studio CMS
                  </a>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>

      {/* Trending Strip — Moved BELOW navigation (PLAN.md) */}
      <div className="trending-strip border-t border-[var(--ink-800)]">
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
    </header>
  );
}
