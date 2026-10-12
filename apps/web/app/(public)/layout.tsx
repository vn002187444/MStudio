import { SiteHeader } from "../../components/navigation/site-header";
import { UtilitiesBar } from "../../components/widgets/utilities-bar";
import { MobileTabBar } from "../../components/navigation/mobile-tab-bar";

/**
 * Public route group layout (MST-012, MST-075 Editorial Shell).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell" style={{ paddingBottom: 64 }}>
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <UtilitiesBar />
      {children}
      <footer className="site-footer" style={{ borderTop: "1px solid var(--border)", padding: "40px 16px 60px", background: "var(--white)" }}>
        <div style={{ maxWidth: "var(--max-content-width, 1280px)", margin: "0 auto", textAlign: "center" }}>
          <p translate="no" style={{ fontSize: "var(--text-xl, 20px)", fontWeight: 800, margin: "0 0 8px", letterSpacing: "0.02em" }}>
            MSTUDIO <span style={{ color: "var(--accent, #2563eb)" }}>CHANNEL</span>
          </p>
          <p style={{ color: "var(--gray)", fontSize: "var(--text-sm)", margin: 0 }}>
            Tạp chí tin tức công nghệ, kinh tế &amp; phân tích đa nguồn thông minh.
          </p>
        </div>
      </footer>
      <MobileTabBar />
    </div>
  );
}
