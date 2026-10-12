import { ScheduledQueue } from "../../components/scheduled-queue";

/**
 * Scheduled — bài status=scheduled. API chưa có publishAt/scheduled_at
 * (articles table chỉ có status) nên hiển thị theo status + TODO backend.
 */
export default function ScheduledPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>
        Scheduled
      </h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Bài đã lên lịch chờ publish.
      </p>
      <ScheduledQueue />
    </main>
  );
}
