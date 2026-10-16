import { SourcesManager } from "../../../components/sources-manager";

/**
 * Sources — Quản trị nguồn tin & feeds crawl tự động.
 * Hỗ trợ CRUD, phân quyền TokenGate (Admin/Human Lead), quản lý luồng RSS/Atom.
 */
export default function SourcesPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Sources & Feeds</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Quản lý nguồn tin (VnExpress, Tuổi Trẻ, TechCrunch, The Verge, Wired, YouTube, Reddit...) và các luồng RSS/Atom crawl tự động.
      </p>
      <SourcesManager />
    </main>
  );
}
