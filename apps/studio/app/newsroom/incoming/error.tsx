"use client";

/**
 * Incoming error state (MST-005). Client boundary chỉ cho nút thử lại.
 */
export default function IncomingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Incoming</h1>
      <div role="alert" style={{ background: "var(--white)", border: "1px solid var(--breaking-red)", borderRadius: "var(--radius-md)", padding: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Không tải được tin incoming</h2>
        <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
          Đã xảy ra lỗi khi tải hàng đợi. Vui lòng thử lại.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "var(--black)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--white)",
            cursor: "pointer",
            padding: "8px 16px",
          }}
          type="button"
        >
          Thử lại
        </button>
      </div>
    </main>
  );
}
