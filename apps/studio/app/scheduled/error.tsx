"use client";

/**
 * Scheduled error state. Client boundary chỉ cho nút thử lại.
 */
export default function ScheduledError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>
        Scheduled
      </h1>
      <div role="alert" style={{ background: "var(--white)", border: "1px solid var(--breaking-red)", borderRadius: "var(--radius-md)", padding: 24 }}>
        <h2 style={{ fontSize: "var(--text-base)", margin: "0 0 4px" }}>
          Không tải được bài lên lịch
        </h2>
        <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
          Đã xảy ra lỗi khi tải danh sách scheduled. Vui lòng thử lại.
        </p>
        <button className="btn-primary" onClick={() => reset()} type="button">
          Thử lại
        </button>
      </div>
    </main>
  );
}
