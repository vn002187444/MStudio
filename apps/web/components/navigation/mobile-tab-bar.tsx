"use client";

import { usePathname } from "next/navigation";
import { SpringButton } from "@mstudio/ui";

/**
 * Mobile App-Like Tab Bar (MST-110 Hybrid Glassmorphic).
 * - Floating glass dock with spring feedback.
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
      className="fixed bottom-[max(env(safe-area-inset-bottom),16px)] left-1/2 -translate-x-1/2 z-[var(--z-overlay)] md:hidden w-[calc(100%-32px)] max-w-[400px]"
    >
      <ul className="glass-shell rounded-full flex items-center justify-around m-0 p-1.5 list-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border border-white/20">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <li key={tab.href} className="flex-1 flex justify-center">
              <a href={tab.href} aria-current={isActive ? "page" : undefined} className="block w-full text-inherit no-underline">
                <SpringButton
                  className={`w-full flex flex-col items-center justify-center min-h-[48px] py-1 text-center no-underline transition-colors duration-150 rounded-full ${
                    isActive
                      ? "text-[var(--ink)] font-semibold bg-white/40 shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--ink)] font-medium bg-transparent hover:bg-white/20"
                  }`}
                >
                  <span className="flex flex-col items-center justify-center gap-0.5">
                    <TabIcon id={tab.id} />
                    <span className="text-[10px] leading-tight tracking-tight">
                      {tab.label}
                    </span>
                  </span>
                </SpringButton>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
