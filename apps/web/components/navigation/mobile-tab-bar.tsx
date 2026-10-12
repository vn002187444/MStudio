"use client";

import { usePathname } from "next/navigation";

/**
 * Mobile App-Like Tab Bar (MST-075 / FU-25):
 * - Hiển thị cố định ở chân màn hình trên điện thoại.
 * - Chuẩn iOS Safe Area Insets (`env(safe-area-inset-bottom)`).
 * - Hiệu ứng kính mờ Frosted Glass + tactile press scale(0.96).
 */
export function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { label: "Trang chủ", href: "/", icon: "🏠" },
    { label: "Tin nóng", href: "/thoi-su", icon: "🚨" },
    { label: "Công nghệ", href: "/cong-nghe", icon: "⚡" },
    { label: "Kinh doanh", href: "/kinh-doanh", icon: "📈" },
  ];

  return (
    <nav
      aria-label="Điều hướng nhanh di động"
      className="mobile-only-tabbar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        zIndex: 9999,
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        paddingTop: "6px",
      }}
    >
      <ul
        style={{
          display: "flex",
          justifyContent: "space-around",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <li key={tab.href}>
              <a
                href={tab.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  textDecoration: "none",
                  color: isActive ? "var(--accent, #2563eb)" : "var(--ink-700, #4b5563)",
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : 500,
                  padding: "4px 12px",
                  transition: "transform 0.15s ease",
                }}
              >
                <span style={{ fontSize: "18px" }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
