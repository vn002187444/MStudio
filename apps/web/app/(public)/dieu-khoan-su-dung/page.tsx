import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | MStudio Channel",
  description:
    "Quy định sử dụng dịch vụ, quyền sở hữu trí tuệ, chính sách trích dẫn và trách nhiệm của người dùng khi truy cập MStudio Channel.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <main
      className="home-main"
      id="main-content"
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "32px 16px 80px",
      }}
    >
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <ol style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, margin: 0, fontSize: "14px" }}>
          <li>
            <a href="/" style={{ color: "var(--gray)", textDecoration: "none" }}>
              Trang chủ
            </a>
          </li>
          <li style={{ color: "var(--gray)" }}>/</li>
          <li style={{ color: "var(--accent, #2563eb)", fontWeight: 600 }}>Điều khoản sử dụng</li>
        </ol>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: 40, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 12px",
            color: "var(--ink, #101114)",
          }}
        >
          Điều khoản sử dụng dịch vụ
        </h1>
        <div style={{ fontSize: "14px", color: "var(--gray)", marginBottom: 12 }}>
          Có hiệu lực từ ngày: <strong>01/01/2026</strong> | Cập nhật gần nhất: <strong>16/10/2026</strong>
        </div>
        <p style={{ fontSize: "16px", color: "var(--ink-700, #4b5563)", margin: 0, lineHeight: 1.6 }}>
          Chào mừng bạn đến với MStudio Channel. Bằng việc truy cập, đọc hoặc chia sẻ nội dung từ trang web này,
          bạn đồng ý tuân thủ các điều khoản và quy định được nêu rõ dưới đây.
        </p>
      </header>

      {/* Content */}
      <div className="prose prose-slate max-w-none" style={{ lineHeight: 1.8, fontSize: "15px", color: "var(--ink-700, #374151)" }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            1. Chấp thuận điều khoản
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            Nếu bạn không đồng ý với bất kỳ điều khoản nào trong văn bản này, vui lòng ngưng sử dụng trang web. Chúng tôi
            có quyền sửa đổi, bổ sung các điều khoản này vào bất kỳ lúc nào để phù hợp với quy định pháp luật và hoạt động
            thực tế của tòa soạn. Các thay đổi có hiệu lực ngay khi được đăng tải công khai.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            2. Quyền sở hữu trí tuệ & Quy định trích dẫn
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            Toàn bộ giao diện thiết kế, mã nguồn, biểu tượng thương hiệu, cơ sở dữ liệu và các bài viết phân tích tổng hợp
            độc quyền trên MStudio Channel đều thuộc quyền sở hữu của MStudio hoặc đã được cấp phép sử dụng hợp pháp.
          </p>
          <ul style={{ paddingLeft: 24, margin: "0 0 12px" }}>
            <li>
              <strong>Được phép:</strong> Các cơ quan, tổ chức, cá nhân được quyền trích dẫn phi thương mại không quá
              150 từ của bài viết, kèm theo đường dẫn liên kết (backlink) trực tiếp và ghi rõ nguồn <em>"Theo MStudio Channel"</em>.
            </li>
            <li>
              <strong>Nghiêm cấm:</strong> Tự động sao chép hàng loạt (scraping), xuất bản lại nguyên văn toàn bộ bài
              viết nhằm mục đích thương mại mà chưa có sự đồng ý bằng văn bản của Ban biên tập MStudio Channel.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            3. Trách nhiệm của người sử dụng
          </h2>
          <p style={{ margin: "0 0 12px" }}>Khi tương tác, gửi đóng góp hoặc chia sẻ bài viết, bạn cam kết không:</p>
          <ul style={{ paddingLeft: 24, margin: "0 0 12px" }}>
            <li>Phát tán thông tin sai lệch, xuyên tạc, xúc phạm danh dự nhân phẩm của tổ chức, cá nhân.</li>
            <li>Phát tán mã độc, virus hoặc thực hiện hành vi tấn công từ chối dịch vụ (DDoS) gây gián đoạn hệ thống.</li>
            <li>Giả mạo biên tập viên, nhà báo hoặc nhân sự của MStudio Channel dưới bất kỳ hình thức nào.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            4. Miễn trừ trách nhiệm (Disclaimer)
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            MStudio Channel luôn nỗ lực tối đa để xác thực thông tin từ nhiều nguồn uy tín trước khi xuất bản. Tuy nhiên:
          </p>
          <ul style={{ paddingLeft: 24, margin: "0 0 12px" }}>
            <li>
              Các thông tin liên quan đến tài chính, chứng khoán, y tế và pháp lý mang tính chất tham khảo kiến thức tổng
              hợp, không phải lời khuyên đầu tư hay chỉ định y khoa thay thế bác sĩ chuyên môn.
            </li>
            <li>
              Chúng tôi không chịu trách nhiệm đối với nội dung của các trang web bên ngoài được liên kết trong mục Nguồn tin
              tham khảo.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            5. Luật điều chỉnh & Giải quyết tranh chấp
          </h2>
          <p style={{ margin: "0 0 16px" }}>
            Các điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh
            chấp phát sinh trước hết sẽ được giải quyết thông qua thương lượng hòa giải thiện chí giữa các bên.
          </p>
          <div
            style={{
              padding: "16px 20px",
              background: "var(--soft, #f8fafc)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          >
            Nếu có thắc mắc về điều khoản sử dụng, vui lòng gửi email về:{" "}
            <a href="mailto:legal@mstudio.minds.io.vn" style={{ color: "var(--brand, #155eef)", fontWeight: 600 }}>
              legal@mstudio.minds.io.vn
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
