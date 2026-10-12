import { CorrectionsQueue } from "../../components/corrections-queue";

/**
 * Corrections — yêu cầu sửa lỗi. Chưa có bảng corrections/flags ở backend
 * nên section requests để empty state + ghi chú; bên dưới là bài đã
 * corrected/retracted từ status queue hiện có.
 */
export default function CorrectionsPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>
        Corrections
      </h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Yêu cầu sửa lỗi và bài đã corrected/retracted.
      </p>
      <CorrectionsQueue />
    </main>
  );
}
