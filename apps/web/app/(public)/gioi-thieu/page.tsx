import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu về MStudio Channel | Nền tảng tin tức số xác thực đa nguồn",
  description:
    "Tìm hiểu về sứ mệnh, giá trị cốt lõi và kiến trúc công nghệ kiểm chứng tin tức tự động của MStudio Channel.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
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
          <li style={{ color: "var(--accent, #2563eb)", fontWeight: 600 }}>Giới thiệu</li>
        </ol>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: 40, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 16px",
            color: "var(--ink, #101114)",
          }}
        >
          Giới thiệu về MStudio Channel
        </h1>
        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.6,
            color: "var(--ink-700, #4b5563)",
            margin: 0,
          }}
        >
          Nền tảng báo chí số thế hệ mới — Tiên phong tích hợp công nghệ AI Agentic và quy trình kiểm
          chứng đa nguồn minh bạch, mang tới thông tin chuẩn xác và đáng tin cậy.
        </p>
      </header>

      {/* Main Content Articles */}
      <article className="prose prose-slate max-w-none" style={{ lineHeight: 1.8, fontSize: "16px" }}>
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 16px", color: "var(--ink, #101114)" }}>
            1. Sứ mệnh của chúng tôi
          </h2>
          <p style={{ margin: "0 0 16px" }}>
            Trong kỷ nguyên bùng nổ thông tin và sự tràn lan của tin giả (fake news), độc giả ngày càng gặp
            nhiều khó khăn trong việc tiếp cận những dòng tin chân thực và có giá trị. <strong>MStudio Channel</strong>{" "}
            được xây dựng với một mục tiêu duy nhất: <em>Cung cấp bức tranh toàn cảnh về các sự kiện đang diễn ra
            với tốc độ nhanh nhất, nhưng tuyệt đối không đánh đổi sự chuẩn xác.</em>
          </p>
          <p style={{ margin: 0 }}>
            Chúng tôi không chỉ là một trang tin tức, mà là một không gian tri thức mở, nơi mọi bài viết đều có
            nguồn gốc rõ ràng, lịch sử sửa đổi minh bạch và trích dẫn đầy đủ theo chuẩn đạo đức báo chí quốc tế.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 16px", color: "var(--ink, #101114)" }}>
            2. Giá trị cốt lõi: 4 Trụ cột vững chắc
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: "var(--soft, #f8fafc)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: 8 }}>🔍</div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Xác thực đa nguồn</h3>
              <p style={{ fontSize: "14px", color: "var(--ink-700, #4b5563)", margin: 0 }}>
                Mỗi sự kiện được đối chiếu chéo từ nhiều nguồn uy tín độc lập trong nước và quốc tế trước khi
                được tổng hợp và xuất bản.
              </p>
            </div>

            <div
              style={{
                background: "var(--soft, #f8fafc)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: 8 }}>⚖️</div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Trung lập & Khách quan</h3>
              <p style={{ fontSize: "14px", color: "var(--ink-700, #4b5563)", margin: 0 }}>
                Nội dung thuật lại sự thật dựa trên dữ kiện, số liệu kiểm chứng và bối cảnh toàn diện, không định
                hướng hay thổi phồng sự việc.
              </p>
            </div>

            <div
              style={{
                background: "var(--soft, #f8fafc)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: 8 }}>📜</div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Tôn trọng bản quyền</h3>
              <p style={{ fontSize: "14px", color: "var(--ink-700, #4b5563)", margin: 0 }}>
                Ghi nhận nguồn tin gốc, tôn trọng quyền sở hữu trí tuệ của tác giả và cơ quan báo chí phát hành ban
                đầu qua khối liên kết nguồn minh bạch.
              </p>
            </div>

            <div
              style={{
                background: "var(--soft, #f8fafc)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: 8 }}>⚡</div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px" }}>Tốc độ & Trải nghiệm</h3>
              <p style={{ fontSize: "14px", color: "var(--ink-700, #4b5563)", margin: 0 }}>
                Vận hành trên mạng lưới Cloudflare Edge phân tán toàn cầu, tối ưu tốc độ phản hồi cực nhanh dưới
                100ms và không chứa quảng cáo gây phiền toái.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 16px", color: "var(--ink, #101114)" }}>
            3. Kiến trúc Công nghệ & AI Nhân văn
          </h2>
          <p style={{ margin: "0 0 16px" }}>
            MStudio Channel áp dụng kiến trúc luồng dữ liệu <strong>Evidence-first</strong>. Nghĩa là AI không được
            phép tự sáng tác hoặc phóng tác dữ liệu; mọi câu chữ trong bài phân tích đều phải neo vào bằng chứng
            (evidence bundle) có thể truy vết được.
          </p>
          <p style={{ margin: 0 }}>
            Hệ thống giám sát chất lượng nội dung hoạt động 24/7 để phát hiện kịp thời các mâu thuẫn thông tin, tự
            động tạo bản hiệu chỉnh minh bạch khi có diễn biến mới, và đảm bảo mọi phát biểu của chuyên gia đều
            được dẫn nguồn xác thực.
          </p>
        </section>

        <section
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
            padding: "32px",
            borderRadius: "16px",
            marginTop: 40,
          }}
        >
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px", color: "#f8fafc" }}>
            Đồng hành cùng MStudio Channel
          </h2>
          <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, margin: "0 0 20px" }}>
            Chúng tôi luôn lắng nghe mọi phản hồi, đính chính hoặc đóng góp từ phía độc giả để không ngừng hoàn
            thiện chất lượng bản tin mỗi ngày.
          </p>
          <a
            href="/lien-he"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#2563eb",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            <span>Gửi ý kiến đóng góp cho Ban biên tập</span>
            <span aria-hidden="true">→</span>
          </a>
        </section>
      </article>
    </main>
  );
}
