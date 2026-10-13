"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Pipeline
  { href: "/", label: "Tổng quan", icon: "🏠", group: "Điều hành" },
  { href: "/editor", label: "Viết bài mới", icon: "✍️", group: "Điều hành" },
  { href: "/newsroom/incoming", label: "Tin thô (Incoming)", icon: "📥", group: "Nguồn tin & Biên tập" },
  { href: "/clusters", label: "Chùm tin (Clusters)", icon: "📑", group: "Nguồn tin & Biên tập" },
  { href: "/newsroom/research", label: "Góc kiểm chứng", icon: "🔍", group: "Nguồn tin & Biên tập" },
  { href: "/drafts", label: "Bản thảo AI", icon: "📝", group: "Nguồn tin & Biên tập" },
  { href: "/newsroom/needs-review", label: "Chờ duyệt (15m)", icon: "⏳", badge: "15m", group: "Nguồn tin & Biên tập" },
  { href: "/scheduled", label: "Lên lịch", icon: "🕒", group: "Nguồn tin & Biên tập" },
  { href: "/newsroom/published", label: "Đã xuất bản", icon: "✅", group: "Nguồn tin & Biên tập" },
  { href: "/corrections", label: "Đính chính", icon: "🛠️", group: "Nguồn tin & Biên tập" },
  { href: "/email", label: "Hộp thư Email", icon: "✉️", badge: "3", group: "Nguồn tin & Biên tập" },
  { href: "/newsroom/sources", label: "Nguồn RSS", icon: "📡", group: "Nguồn tin & Biên tập" },

  // Growth & Discovery
  { href: "/audience", label: "Độc giả & View", icon: "📊", group: "Tăng trưởng & SEO" },
  { href: "/seo", label: "Rank Math SEO", icon: "🎯", badge: "Pro", group: "Tăng trưởng & SEO" },
  { href: "/media", label: "Thư viện Media", icon: "🖼️", group: "Tăng trưởng & SEO" },
  { href: "/ai-desk", label: "AI Desk", icon: "⚡", group: "Tăng trưởng & SEO" },

  // System
  { href: "/automation", label: "Tự động hóa (Cron)", icon: "🤖", group: "Hệ thống" },
  { href: "/settings", label: "Cài đặt & Token", icon: "⚙️", group: "Hệ thống" },
];

const BOTTOM_TABS = [
  { href: "/", label: "Tổng quan", icon: "🏠" },
  { href: "/newsroom/incoming", label: "Tin thô", icon: "📥" },
  { href: "/editor", label: "Viết bài", icon: "✍️" },
  { href: "/newsroom/needs-review", label: "Duyệt 15m", icon: "⏳" },
  { href: "/audience", label: "Số liệu", icon: "📊" },
];

export function StudioShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const groups = Array.from(new Set(NAV_ITEMS.map((item) => item.group || "Chung")));

  return (
    <div className="studio-layout">
      {/* Mobile Top App Bar (iOS style frosted glass) */}
      <header className="mobile-header">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-header__btn"
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="mobile-header__brand">
          <span>MSTUDIO</span> <strong>STUDIO</strong>
        </div>
        <Link href="/editor" className="mobile-header__action">
          + Viết
        </Link>
      </header>

      {/* Desktop Sidebar & Mobile Slide-over Drawer */}
      <aside
        className={`studio-sidebar ${mobileMenuOpen ? "studio-sidebar--open" : ""}`}
        aria-label="Điều hướng Studio"
      >
        <div className="studio-sidebar__brand">
          <p style={{ fontWeight: 800, letterSpacing: "0.04em", margin: 0, fontSize: "16px" }}>
            MSTUDIO <span style={{ fontWeight: 400, color: "var(--gray)" }}>STUDIO</span>
          </p>
          <span className="live-indicator">LIVE</span>
        </div>

        <nav className="studio-sidebar__nav">
          {groups.map((group) => (
            <div key={group} className="nav-group">
              <span className="nav-group__title">{group}</span>
              <ul className="nav-list">
                {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`nav-link ${isActive ? "nav-link--active" : ""}`}
                      >
                        <span className="nav-link__icon">{item.icon}</span>
                        <span className="nav-link__label">{item.label}</span>
                        {item.badge && <span className="nav-link__badge">{item.badge}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="studio-main">
        <div className="studio-content">{children}</div>
      </main>

      {/* iOS Bottom Tab Bar for Quick Access on Mobile */}
      <nav className="mobile-bottom-tabs" aria-label="Điều hướng nhanh di động">
        {BOTTOM_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`bottom-tab ${isActive ? "bottom-tab--active" : ""}`}
            >
              <span className="bottom-tab__icon">{tab.icon}</span>
              <span className="bottom-tab__label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
