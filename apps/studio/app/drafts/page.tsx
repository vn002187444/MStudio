import { DraftsQueue } from "../../components/drafts-queue";

/**
 * Drafts — bài status=drafted: sửa (editor) hoặc chuyển pipeline
 * (drafted → ai_qa → human_review …) và publish khi đã scheduled.
 */
export default function DraftsPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Drafts</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Bản nháp chờ đưa vào pipeline — chuyển sang ai_qa để duyệt, hoặc mở
        editor để sửa.
      </p>
      <DraftsQueue />
    </main>
  );
}
