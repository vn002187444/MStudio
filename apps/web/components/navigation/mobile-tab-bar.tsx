"use client";

import { usePathname } from "next/navigation";

/**
 * Mobile App-Like Tab Bar (MST-075 / FU-25):
 * - Hiển thị cố định ở chân màn hình trên điện thoại (ẩn trên desktop `md:hidden`).
 * - Chuẩn iOS Safe Area Insets (`env(safe-area-inset-bottom)`).
 * - Hiệu ứng kính mờ Frosted Glass (`frosted-glass`) + tactile press (`press-scale`).
 * - 4 Tab chuẩn PLAN: Trang chủ, Khám phá, Tìm kiếm, Đã lưu.
 * - Chấm chỉ báo active dưới icon + chuyển màu.
 */

interface TabItem {
  readonly id: "home" | "explore" | "search" | "saved";
  readonly label: string;
  readonly href: string;
}

const TABS: readonly TabItem[] = [
  { id: "home", label: "Trang chủ", href: "/" },
  { id: "explore", label: "Khám phá", href: "/kham-pha" },
  { id: "search", label: "Tìm kiếm", href: "/search" },
  { id: "saved", label: "Đã lưu", href: "/da-luu" },
];

function TabIcon({ id }: { readonly id: TabItem["id"] }) {
  switch (id) {
    case "home":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5 shrink-0"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "explore":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5 shrink-0"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "search":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5 shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "saved":
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="w-5 h-5 shrink-0"
        >
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      );
  }
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng nhanh di động"
      className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-[var(--z-overlay)] md:hidden frosted-glass bg-white/90 border-t border-black/[0.08] pt-1.5 pb-[max(env(safe-area-inset-bottom),8px)]"
    >
      <ul className="flex items-center justify-around m-0 p-0 list-none">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <li key={tab.href} className="flex-1 flex justify-center">
              <a
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`press-scale flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-0.5 text-center no-underline transition-colors duration-150 ${
                  isActive
                    ? "text-[var(--ink)] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--ink)] font-medium"
                }`}
              >
                <div className="relative flex flex-col items-center justify-center">
                  <TabIcon id={tab.id} />
                  <span
                    aria-hidden="true"
                    className={`tab-active-dot transition-all duration-150 ${
                      isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
                    }`}
                  />
                </div>
                <span className="text-[11px] leading-tight mt-0.5 tracking-tight">
                  {tab.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
