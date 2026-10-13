import { OverviewDashboard } from "../components/overview-dashboard";

/**
 * Studio Homepage — Overview dashboard đầy đủ số liệu newsroom,
 * bài mới nhất và lối tắt điều phối quy trình biên tập.
 */
export default function StudioHomePage() {
  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px", fontWeight: 700 }}>Overview</h1>
          <p style={{ color: "var(--gray)", margin: 0, fontSize: "var(--text-sm)" }}>
            Bảng điều khiển newsroom: trạng thái quy trình xuất bản, bài mới nhất và lối tắt tác vụ.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="btn-primary" href="/editor" style={{ textDecoration: "none", padding: "8px 16px" }}>
            + Viết bài mới
          </a>
        </div>
      </div>
      <OverviewDashboard />
    </main>
  );
}

