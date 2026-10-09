/**
 * Research Desk (MST-022) — three-pane layout: SOURCES | FACT/CLAIM MATRIX | INTELLIGENCE.
 * Dữ liệu story thật từ MST-021/MST-031; chưa có thì hiển thị empty state trung thực.
 * Shapes theo packages/contracts story.ts (FactRecord, ClaimRecord, StorySourceRecord).
 */
export default function ResearchDeskPage() {
  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>Research Desk</h1>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        Chọn một story để nghiên cứu — ma trận fact/claim và intelligence sẽ hiển thị khi có dữ liệu clustering (MST-021).
      </p>
      <div className="desk-grid">
        <section aria-labelledby="desk-sources-heading" className="desk-pane">
          <h2 id="desk-sources-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
            Sources
          </h2>
          <p role="status" style={{ color: "var(--gray)", margin: 0 }}>
            Chưa có story source nào — gắn RawItem vào story ở pipeline intelligence.
          </p>
        </section>
        <section aria-labelledby="desk-matrix-heading" className="desk-pane">
          <h2 id="desk-matrix-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
            Fact / Claim Matrix
          </h2>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left" }}>Nội dung</th>
                <th scope="col" style={{ textAlign: "left" }}>Loại</th>
                <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} role="status" style={{ color: "var(--gray)" }}>
                  Chưa có fact/claim — verification writer (MST-031) sẽ điền ma trận này.
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section aria-labelledby="desk-intel-heading" className="desk-pane">
          <h2 id="desk-intel-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
            Intelligence
          </h2>
          <p role="status" style={{ color: "var(--gray)", margin: 0 }}>
            Chưa có phân tích entity/mâu thuẫn — cluster stage (MST-021) sẽ cung cấp.
          </p>
        </section>
      </div>
    </main>
  );
}
