import { SiteHeader } from "../../components/navigation/site-header";
import { UtilitiesBar } from "../../components/widgets/utilities-bar";
import { EditorialFooter } from "../../components/navigation/editorial-footer";
import { MobileTabBar } from "../../components/navigation/mobile-tab-bar";

/**
 * Public route group layout (MST-012, MST-075 Editorial Shell).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <UtilitiesBar />
      {children}
      <EditorialFooter />
      <MobileTabBar />
    </div>
  );
}
