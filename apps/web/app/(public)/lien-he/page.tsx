import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Liên hệ Ban biên tập | MStudio Channel",
  description:
    "Thông tin liên hệ tòa soạn, đường dây nóng, tiếp nhận góp ý, đính chính và hợp tác nội dung cùng MStudio Channel.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactPage() {
  return (
    <main
      className="home-main"
      id="main-content"
      style={{
        maxWidth: "1080px",
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
          <li style={{ color: "var(--accent, #2563eb)", fontWeight: 600 }}>Liên hệ</li>
        </ol>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
        <h1
          style={{
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 12px",
            color: "var(--ink, #101114)",
          }}
        >
          Liên hệ & Đóng góp ý kiến
        </h1>
        <p style={{ fontSize: "16px", color: "var(--ink-700, #4b5563)", margin: 0, maxWidth: 740, lineHeight: 1.6 }}>
          Ban biên tập MStudio Channel luôn sẵn sàng lắng nghe mọi ý kiến đóng góp, phản hồi về tính chuẩn xác của
          thông tin, hoặc đề xuất hợp tác từ độc giả và đối tác báo chí.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 36,
        }}
      >
        {/* Contact Info (5 cols) */}
        <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
          <div
            style={{
              background: "var(--soft, #f8fafc)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "var(--ink, #101114)" }}>
              Thông tin tòa soạn
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, fontSize: "14px" }}>
              <div>
                <div style={{ fontWeight: 600, color: "var(--ink, #101114)", marginBottom: 4 }}>
                  🏢 Tòa soạn MStudio Channel
                </div>
                <div style={{ color: "var(--ink-700, #4b5563)", lineHeight: 1.5 }}>
                  Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: "var(--ink, #101114)", marginBottom: 4 }}>
                  📧 Thư điện tử (Email)
                </div>
                <div style={{ color: "var(--brand, #155eef)" }}>
                  <a href="mailto:contact@mstudio.minds.io.vn" style={{ textDecoration: "none", color: "inherit" }}>
                    contact@mstudio.minds.io.vn
                  </a>
                </div>
                <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: 2 }}>
                  (Tiếp nhận thông cáo báo chí, yêu cầu bản quyền & hợp tác)
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: "var(--ink, #101114)", marginBottom: 4 }}>
                  📞 Đường dây nóng độc giả
                </div>
                <div style={{ color: "var(--ink, #101114)", fontWeight: 700 }}>
                  (+84) 28 3822 6886
                </div>
                <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: 2 }}>
                  (Hỗ trợ 24/7 đối với thông tin phản ánh khẩn cấp)
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, color: "var(--ink, #101114)", marginBottom: 4 }}>
                  ⚖️ Đính chính & Khiếu nại thông tin
                </div>
                <div style={{ color: "var(--brand, #155eef)" }}>
                  <a href="mailto:corrections@mstudio.minds.io.vn" style={{ textDecoration: "none", color: "inherit" }}>
                    corrections@mstudio.minds.io.vn
                  </a>
                </div>
                <div style={{ fontSize: "12px", color: "var(--gray)", marginTop: 2 }}>
                  Cam kết xử lý và phản hồi trong vòng tối đa 24 giờ làm việc.
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "12px",
              padding: "20px",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#1e40af",
            }}
          >
            <strong>💡 Bạn có nguồn tin hoặc video thời sự muốn chia sẻ?</strong>
            <p style={{ margin: "6px 0 0" }}>
              MStudio cam kết bảo mật danh tính nguồn tin theo đúng đạo đức báo chí nghề nghiệp.
            </p>
          </div>
        </div>

        {/* Contact Form (7 cols) */}
        <div className="col-span-12 md:col-span-7">
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "28px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px", color: "var(--ink, #101114)" }}>
              Gửi tin nhắn trực tiếp
            </h2>
            <p style={{ fontSize: "14px", color: "var(--gray)", margin: "0 0 24px" }}>
              Điền thông tin vào mẫu bên dưới, chúng tôi sẽ liên hệ lại với bạn sớm nhất.
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
