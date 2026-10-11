import { NeedsReviewQueue } from "../../../components/needs-review-queue";

/**
 * Needs Review — hàng đợi biên tập theo status (MST, CMS bàn duyệt).
 * Dữ liệu cần token Editor+ nên fetch phía client; xem TokenGate.
 */
export default function NeedsReviewPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Needs Review</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Bài chờ duyệt theo từng trạng thái — chuyển trạng thái hoặc publish
        trực tiếp khi đủ điều kiện.
      </p>
      <NeedsReviewQueue />
    </main>
  );
}
