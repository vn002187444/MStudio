import type { Metadata } from "next";
import { BentoGrid, BentoCard, AmbientGlow } from "@mstudio/ui";

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
      className="home-main min-h-screen bg-[#07080B] text-slate-100 relative overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(37, 99, 235, 0.15)" size={500} className="-top-32 -left-20 pointer-events-none" />
      <AmbientGlow color="rgba(6, 182, 212, 0.1)" size={400} className="top-1/2 -right-20 pointer-events-none" />

      <div className="container-content max-w-5xl mx-auto px-4 py-12 relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-medium">
            <li>
              <a href="/" className="text-slate-400 hover:text-white transition-colors">
                Trang chủ
              </a>
            </li>
            <li className="text-slate-600">/</li>
            <li className="text-cyan-400 font-semibold">Giới thiệu</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Giới thiệu về MStudio Channel
          </h1>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal max-w-3xl">
            Nền tảng báo chí số thế hệ mới — Tiên phong tích hợp công nghệ AI Agentic và quy trình kiểm
            chứng đa nguồn minh bạch, mang tới thông tin chuẩn xác và đáng tin cậy.
          </p>
        </header>

        {/* 1. Sứ mệnh */}
        <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 mb-10 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
            1. Sứ mệnh của chúng tôi
          </h2>
          <p className="text-base leading-relaxed text-slate-200 mb-4">
            Trong kỷ nguyên bùng nổ thông tin và sự tràn lan của tin giả (fake news), độc giả ngày càng gặp
            nhiều khó khăn trong việc tiếp cận những dòng tin chân thực và có giá trị. <strong className="text-white font-bold">MStudio Channel</strong>{" "}
            được xây dựng với một mục tiêu duy nhất: <em className="italic text-cyan-200">Cung cấp bức tranh toàn cảnh về các sự kiện đang diễn ra
            với tốc độ nhanh nhất, nhưng tuyệt đối không đánh đổi sự chuẩn xác.</em>
          </p>
          <p className="text-base leading-relaxed text-slate-300 m-0">
            Chúng tôi không chỉ là một trang tin tức, mà là một không gian tri thức mở, nơi mọi bài viết đều có
            nguồn gốc rõ ràng, lịch sử sửa đổi minh bạch và trích dẫn đầy đủ theo chuẩn đạo đức báo chí quốc tế.
          </p>
        </section>

        {/* 2. Giá trị cốt lõi */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            2. Giá trị cốt lõi: 4 Trụ cột vững chắc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/40 transition-colors">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white mb-2">Xác thực đa nguồn</h3>
              <p className="text-sm text-slate-300 leading-relaxed m-0">
                Mỗi sự kiện được đối chiếu chéo từ nhiều nguồn uy tín độc lập trong nước và quốc tế trước khi
                được tổng hợp và xuất bản.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/40 transition-colors">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="text-lg font-bold text-white mb-2">Trung lập & Khách quan</h3>
              <p className="text-sm text-slate-300 leading-relaxed m-0">
                Nội dung thuật lại sự thật dựa trên dữ kiện, số liệu kiểm chứng và bối cảnh toàn diện, không định
                hướng hay thổi phồng sự việc.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/40 transition-colors">
              <div className="text-3xl mb-3">📜</div>
              <h3 className="text-lg font-bold text-white mb-2">Tôn trọng bản quyền</h3>
              <p className="text-sm text-slate-300 leading-relaxed m-0">
                Ghi nhận nguồn tin gốc, tôn trọng quyền sở hữu trí tuệ của tác giả và cơ quan báo chí phát hành ban
                đầu qua khối liên kết nguồn minh bạch.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 shadow-xl hover:border-cyan-500/40 transition-colors">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Tốc độ & Trải nghiệm</h3>
              <p className="text-sm text-slate-300 leading-relaxed m-0">
                Vận hành trên mạng lưới Cloudflare Edge phân tán toàn cầu, tối ưu tốc độ phản hồi cực nhanh dưới
                100ms và không chứa quảng cáo gây phiền toái.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Kiến trúc Công nghệ */}
        <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 mb-10 shadow-xl backdrop-blur-xl">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            3. Kiến trúc Công nghệ & AI Nhân văn
          </h2>
          <p className="text-base leading-relaxed text-slate-200 mb-4">
            MStudio Channel áp dụng kiến trúc luồng dữ liệu <strong className="text-white font-bold">Evidence-first</strong>. Nghĩa là AI không được
            phép tự sáng tác hoặc phóng tác dữ liệu; mọi câu chữ trong bài phân tích đều phải neo vào bằng chứng
            (evidence bundle) có thể truy vết được.
          </p>
          <p className="text-base leading-relaxed text-slate-300 m-0">
            Hệ thống giám sát chất lượng nội dung hoạt động 24/7 để phát hiện kịp thời các mâu thuẫn thông tin, tự
            động tạo bản hiệu chỉnh minh bạch khi có diễn biến mới, và đảm bảo mọi phát biểu của chuyên gia đều
            được dẫn nguồn xác thực.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-cyan-950/80 border border-cyan-500/30 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl font-bold text-white mb-3">
            Đồng hành cùng MStudio Channel
          </h2>
          <p className="text-slate-300 text-base leading-relaxed mb-6 max-w-2xl">
            Chúng tôi luôn lắng nghe mọi phản hồi, đính chính hoặc đóng góp từ phía độc giả để không ngừng hoàn
            thiện chất lượng bản tin mỗi ngày.
          </p>
          <a
            href="/lien-he"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            <span>Gửi ý kiến đóng góp cho Ban biên tập</span>
            <span aria-hidden="true">→</span>
          </a>
        </section>
      </div>
    </main>
  );
}
