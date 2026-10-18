import { fetchPrimaryNav, trendingTopics } from "./taxonomy";
import { BrandLogo } from "@mstudio/ui";

/**
 * Site header (MST-110 Hybrid Glassmorphic).
 * - Sticky frosted glass header.
 * - Glassmorphism spec from packages/ui.
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
    <header className="site-header glass-shell sticky top-0 w-full z-[var(--z-sticky)] bg-[#07080B]/95 backdrop-blur-xl border-b border-white/10">
      {/* Desktop Main Navigation Bar (72px) */}
      <div className="desktop-bar h-[72px] text-white">
        <BrandLogo variant="channel" size="md" isDark={true} />

        <nav aria-label="Chuyên mục chính" className="desktop-nav flex-1 min-w-0">
          <div className="flex items-center gap-2 w-full">
            <ul className="flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-none flex-1">
              {mainNavItems.map((item) => (
                <li key={item.href} className="shrink-0">
                  <a href={item.href} className="desktop-nav-link text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {otherNavItems.length > 0 && (
              <details className="desktop-dropdown relative shrink-0">
                <summary className="desktop-nav-link cursor-pointer list-none text-slate-200 hover:text-white transition-colors font-medium">Khác ▾</summary>
                <ul className="desktop-dropdown-menu glass-shell text-white border border-white/10 mt-2 bg-slate-900/95">
                  {otherNavItems.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="hover:bg-white/10 text-slate-200 hover:text-white">{item.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/search"
            className="header-search text-slate-200 hover:text-white"
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
            className="header-cms-btn bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors shadow-sm font-semibold"
            title="Truy cập Cổng Biên tập Studio CMS"
          >
            <span aria-hidden="true">✍️</span>
            <span>Biên tập / CMS</span>
          </a>
        </div>
      </div>

      {/* Mobile Bar (56px) */}
      <div className="mobile-bar h-[56px] text-white">
        <BrandLogo variant="channel" size="sm" isDark={true} />

        <div className="flex items-center gap-2">
          <a
            href="/cms"
            target="_blank"
            rel="noopener noreferrer"
            className="header-cms-btn header-cms-btn--mobile bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold"
            title="Biên tập CMS"
          >
            <span aria-hidden="true">✍️</span>
            <span>CMS</span>
          </a>

          <details className="mobile-menu group">
            <summary aria-label="Mở menu chuyên mục" className="text-white border-white/20">Menu</summary>
            <nav aria-label="Chuyên mục (di động)">
              <div className="mobile-menu-drawer glass-shell border border-white/10 mt-2 grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-900/95 p-4 rounded-2xl">
                <div className="col-span-2 text-white font-bold mb-2">Chuyên mục chính</div>
                {mainNavItems.map((item) => (
                  <a href={item.href} key={item.href} className="text-slate-200 hover:text-white bg-white/5 rounded-lg p-2.5">
                    {item.label}
                  </a>
                ))}
                {otherNavItems.length > 0 && (
                  <>
                    <div className="col-span-2 text-white font-bold mt-4 mb-2">Khác</div>
                    {otherNavItems.map((item) => (
                      <a href={item.href} key={item.href} className="text-slate-200 hover:text-white bg-white/5 rounded-lg p-2.5">
                        {item.label}
                      </a>
                    ))}
                  </>
                )}
                <div className="col-span-2 border-t border-white/10 mt-4 pt-4">
                  <div className="text-white font-bold mb-2">Tòa soạn CMS</div>
                  <a
                    href="/cms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:underline inline-block py-2 font-medium"
                  >
                    ✍️ Cổng Biên tập viên / Studio CMS
                  </a>
                </div>
              </div>
            </nav>
          </details>
        </div>
      </div>

      {/* Trending Strip */}
      <div className="trending-strip border-t border-white/10 text-slate-200 bg-slate-950/80">
        <p className="trending-label text-cyan-400 font-bold">Đang nóng</p>
        <nav aria-label="Chủ đề đang nóng">
          <ul className="trending-list">
            {trendingTopics.map((topic) => (
              <li key={topic.href}>
                <a href={topic.href} className="hover:text-cyan-300 text-slate-300 transition-colors">{topic.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
