import { SiteHeader } from "../../components/navigation/site-header";

/**
 * Public route group layout (MST-012 editorial shell).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      {children}
      <footer className="site-footer">
        <p translate="no">MSTUDIO CHANNEL</p>
        <p>Bản dựng biên tập MST-012 — nội dung thật từ pipeline xuất bản (MST-042).</p>
      </footer>
    </div>
  );
}
