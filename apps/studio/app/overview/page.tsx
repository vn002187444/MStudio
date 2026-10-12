import { OverviewDashboard } from "../../components/overview-dashboard";

/**
 * Overview — dashboard tổng quan CMS: số liệu theo status, bài mới nhất,
 * link nhanh module. Counts cần token Editor+ nên fetch phía client.
 */
export default function OverviewPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Overview</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Số liệu newsroom theo trạng thái, bài mới nhất và lối tắt các module.
      </p>
      <OverviewDashboard />
    </main>
  );
}
