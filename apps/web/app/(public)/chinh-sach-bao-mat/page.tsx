import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật dữ liệu | MStudio Channel",
  description:
    "Cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của độc giả theo Nghị định 13/2023/NĐ-CP và các tiêu chuẩn bảo mật quốc tế.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
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
          <li style={{ color: "var(--accent, #2563eb)", fontWeight: 600 }}>Chính sách bảo mật</li>
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
          Chính sách bảo mật thông tin
        </h1>
        <div style={{ fontSize: "14px", color: "var(--gray)", marginBottom: 12 }}>
          Có hiệu lực từ ngày: <strong>01/01/2026</strong> | Cập nhật gần nhất: <strong>16/10/2026</strong>
        </div>
        <p style={{ fontSize: "16px", color: "var(--ink-700, #4b5563)", margin: 0, lineHeight: 1.6 }}>
          MStudio Channel cam kết tôn trọng tuyệt đối quyền riêng tư của độc giả. Bản chính sách này giải thích
          cách thức chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn truy cập và sử dụng dịch vụ trên hệ thống.
        </p>
      </header>

      {/* Content */}
      <div className="prose prose-slate max-w-none" style={{ lineHeight: 1.8, fontSize: "15px", color: "var(--ink-700, #374151)" }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            1. Nguyên tắc thu thập dữ liệu tối thiểu (Data Minimization)
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            Chúng tôi tuân thủ nghiêm ngặt nguyên tắc chỉ thu thập những thông tin thực sự cần thiết nhằm đảm bảo
            tốc độ truyền tải và cá nhân hóa trải nghiệm đọc báo:
          </p>
          <ul style={{ paddingLeft: 24, margin: "0 0 12px" }}>
            <li>
              <strong>Dữ liệu kỹ thuật ẩn danh:</strong> Địa chỉ IP ẩn danh (được băm một chiều ở tầng CDN Cloudflare),
              loại trình duyệt, hệ điều hành và thời gian đọc bài viết để tính toán lưu lượng và ngăn chặn tấn công DDoS.
            </li>
            <li>
              <strong>Dữ liệu cá nhân hóa cục bộ:</strong> Danh sách chuyên mục bạn bấm "Theo dõi" hoặc "Ẩn" được lưu trữ
              trực tiếp trên trình duyệt của bạn (Local Storage/Cookies thiết yếu), không liên kết với danh tính cá nhân.
            </li>
            <li>
              <strong>Thông tin bạn chủ động cung cấp:</strong> Họ tên và email khi bạn gửi thư liên hệ, yêu cầu đính
              chính hoặc đăng ký nhận bản tin qua thư điện tử.
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            2. Cam kết không bán dữ liệu cho bên thứ ba
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            MStudio Channel <strong>tuyệt đối không bán, cho thuê, trao đổi hoặc thương mại hóa</strong> bất kỳ thông tin
            hoặc dữ liệu hành vi đọc báo của độc giả cho các mạng lưới quảng cáo tiếp thị lại (retargeting ads) hay các
            công ty thu thập dữ liệu thứ ba.
          </p>
          <p style={{ margin: 0 }}>
            Dữ liệu thống kê lượt đọc chỉ phục vụ mục đích duy nhất là xếp hạng tin tức đang nóng và cải thiện chất
            lượng bài viết của ban biên tập.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            3. Hạ tầng lưu trữ an toàn & mã hóa bảo mật
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            Hệ thống MStudio Channel được vận hành trên nền tảng Cloudflare Workers và cơ sở dữ liệu phân tán mã hóa
            ở trạng thái nghỉ (Encryption at Rest) và mã hóa trong khi truyền tải (TLS 1.3).
          </p>
          <p style={{ margin: 0 }}>
            Hệ thống không lưu trữ mật khẩu thuần hay thông tin nhạy cảm. Toàn bộ các kết nối API đều được bảo vệ
            bởi tường lửa chống giả mạo danh tính và giám sát bất thường tự động.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            4. Quyền của độc giả đối với dữ liệu cá nhân
          </h2>
          <p style={{ margin: "0 0 12px" }}>
            Theo Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân, bạn có toàn quyền:
          </p>
          <ul style={{ paddingLeft: 24, margin: "0 0 12px" }}>
            <li>Yêu cầu kiểm tra, cập nhật hoặc chỉnh sửa thông tin cá nhân đã cung cấp.</li>
            <li>Yêu cầu xóa toàn bộ lịch sử thư từ hoặc thông tin liên hệ khỏi hệ thống cơ sở dữ liệu.</li>
            <li>Xóa bộ nhớ đệm (Clear cache & cookies) trên trình duyệt bất cứ lúc nào để reset toàn bộ thói quen đọc tin.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink, #101114)", margin: "0 0 12px" }}>
            5. Thông tin đầu mối phụ trách bảo vệ dữ liệu
          </h2>
          <p style={{ margin: "0 0 8px" }}>
            Mọi thắc mắc hoặc yêu cầu thực thi quyền riêng tư, vui lòng liên hệ Bộ phận An toàn Thông tin:
          </p>
          <div
            style={{
              padding: "16px 20px",
              background: "var(--soft, #f8fafc)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            <div><strong>Email chuyên trách:</strong> <a href="mailto:privacy@mstudio.minds.io.vn" style={{ color: "var(--brand, #155eef)" }}>privacy@mstudio.minds.io.vn</a></div>
            <div style={{ marginTop: 4 }}><strong>Địa chỉ:</strong> Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</div>
          </div>
        </section>
      </div>
    </main>
  );
}
