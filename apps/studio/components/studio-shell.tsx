"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpringButton } from "@mstudio/ui";

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
    <div className="flex h-screen overflow-hidden bg-[var(--void-deep)] text-[var(--solar-light)] font-sans">
      {/* Mobile Top App Bar (Acrylic glass) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass-panel z-[var(--z-sticky)] flex items-center justify-between px-4 border-b border-white/10">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2"
          aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="font-bold text-sm tracking-widest text-white">
          <span className="text-white/60">MSTUDIO</span> STUDIO
        </div>
        <Link href="/editor" className="text-blue-400 font-medium text-sm">
          + Viết
        </Link>
      </header>

      {/* Desktop Sidebar & Mobile Slide-over Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[var(--z-overlay)] w-64 glass-panel transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col border-r border-white/10 shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Điều hướng Studio"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10 shrink-0">
          <p className="font-bold tracking-widest text-sm m-0 text-white">
            <span className="text-white/60 font-normal">MSTUDIO</span> STUDIO
          </p>
          <span className="hud-text text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border hud-border hud-bg animate-pulse">
            LIVE
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-none space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <span className="block px-3 text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                {group}
              </span>
              <ul className="space-y-0.5">
                {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                            isActive ? "bg-blue-500/20 text-blue-300" : "bg-white/10 text-white/60"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="glass-panel p-3 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-white/60">Cloudflare Quota</span>
              <span className="text-emerald-400">Stable</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full w-[45%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[calc(var(--z-overlay)-1)] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[url('/grid-bg.svg')] bg-repeat md:pt-0 pt-14 pb-16 md:pb-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full relative z-10">
          {children}
        </div>
      </main>

      {/* iOS Bottom Tab Bar for Quick Access on Mobile */}
      <nav aria-label="Điều hướng nhanh di động" className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] md:hidden glass-panel border-t border-white/10 pb-[max(env(safe-area-inset-bottom),8px)] pt-1">
        <ul className="flex items-center justify-around m-0 p-0 list-none">
          {BOTTOM_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <li key={tab.href} className="flex-1 flex justify-center">
                <Link
                  href={tab.href}
                  className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-colors ${
                    isActive ? "text-blue-400" : "text-white/50 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
