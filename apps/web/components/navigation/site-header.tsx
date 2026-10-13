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
  const primaryLabels = [
    "Mới nhất",
    "Dành cho bạn",
    "Đang nóng",
    "Thời sự",
    "Công nghệ",
    "AI Channel",
    "Kinh tế",
    "Thế giới",
    "Khoa học",
    "Thể thao",
    "Giải trí",
    "Đời sống",
  ];
  const mainNavItems = primaryNav.filter((item) => primaryLabels.includes(item.label));
  const otherNavItems = primaryNav.filter((item) => !primaryLabels.includes(item.label));

  return (
    <header className="site-header frosted-glass bg-black/85">
      {/* Desktop Main Navigation Bar (72px) */}
      <div className="desktop-bar h-[72px]">
        <a className="brand" href="/" translate="no">
          MSTUDIO <span>CHANNEL</span>
        </a>

        <nav aria-label="Chuyên mục chính" className="desktop-nav flex-1 min-w-0">
          <div className="flex items-center gap-2 w-full">
            <ul className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none flex-1">
              {mainNavItems.map((item) => (
                <li key={item.href} className="shrink-0">
                  <a href={item.href} className="desktop-nav-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {otherNavItems.length > 0 && (
              <details className="desktop-dropdown relative shrink-0">
                <summary className="desktop-nav-link cursor-pointer list-none">Khác ▾</summary>
                <ul className="desktop-dropdown-menu">
                  {otherNavItems.map((item) => (
                    <li key={item.href}>
                      <a href={item.href}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
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

          <details className="mobile-menu group">
            <summary aria-label="Mở menu chuyên mục">Menu</summary>
            <nav aria-label="Chuyên mục (di động)">
              <div className="mobile-menu-drawer grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-2 text-[var(--white)] font-bold mb-2">Chuyên mục chính</div>
                {mainNavItems.map((item) => (
                  <a href={item.href} key={item.href}>
                    {item.label}
                  </a>
                ))}
                {otherNavItems.length > 0 && (
                  <>
                    <div className="col-span-2 text-[var(--white)] font-bold mt-4 mb-2">Khác</div>
                    {otherNavItems.map((item) => (
                      <a href={item.href} key={item.href}>
                        {item.label}
                      </a>
                    ))}
                  </>
                )}
                <div className="col-span-2 border-t border-[var(--ink-800)] mt-4 pt-4">
                  <div className="text-[var(--white)] font-bold mb-2">Tòa soạn CMS</div>
                  <a
                    href="/cms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:underline inline-block py-2"
                  >
                    ✍️ Cổng Biên tập viên / Studio CMS
                  </a>
                </div>
              </div>
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
