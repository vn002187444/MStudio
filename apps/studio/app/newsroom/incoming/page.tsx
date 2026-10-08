/**
 * Incoming placeholder (MST-005).
 * Danh sách RawItem thật được nối ở MST-009 sau khi backend MST-008 xong.
 */
export default function IncomingPage() {
  return (
    <main>
      <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Incoming</h1>
      <div role="status" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 24 }}>
        <h2 style={{ fontSize: 16, margin: "0 0 4px" }}>Chưa có tin mới</h2>
        <p style={{ color: "var(--gray)", margin: 0 }}>
          Hàng đợi ingestion (MST-007) chưa chạy — placeholder này sẽ thành danh sách phân trang ở MST-009.
        </p>
      </div>
    </main>
  );
}
