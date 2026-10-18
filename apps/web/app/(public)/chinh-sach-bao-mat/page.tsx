import type { Metadata } from "next";
import { AmbientGlow } from "@mstudio/ui";

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
      className="home-main min-h-screen bg-[#07080B] text-slate-100 relative overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(37, 99, 235, 0.15)" size={500} className="-top-32 -left-20 pointer-events-none" />
      <AmbientGlow color="rgba(16, 185, 129, 0.1)" size={400} className="top-1/2 -right-20 pointer-events-none" />

      <div className="container-content max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-xs font-medium">
            <li>
              <a href="/" className="text-slate-400 hover:text-white transition-colors">
                Trang chủ
              </a>
            </li>
            <li className="text-slate-600">/</li>
            <li className="text-cyan-400 font-semibold">Chính sách bảo mật</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Chính sách bảo mật thông tin
          </h1>
          <div className="text-xs text-slate-400 mb-4 font-mono">
            Có hiệu lực từ ngày: <strong className="text-slate-200">01/01/2026</strong> | Cập nhật gần nhất: <strong className="text-cyan-400">18/10/2026</strong>
          </div>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal m-0">
            MStudio Channel cam kết tôn trọng tuyệt đối quyền riêng tư của độc giả. Bản chính sách này giải thích
            cách thức chúng tôi thu thập, sử dụng và bảo vệ dữ liệu khi bạn truy cập và sử dụng dịch vụ trên hệ thống.
          </p>
        </header>

        {/* Content sections */}
        <div className="space-y-8">
          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              1. Nguyên tắc thu thập dữ liệu tối thiểu (Data Minimization)
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">
              Chúng tôi tuân thủ nghiêm ngặt nguyên tắc chỉ thu thập những thông tin thực sự cần thiết nhằm đảm bảo
              tốc độ truyền tải và cá nhân hóa trải nghiệm đọc báo:
            </p>
            <ul className="space-y-3 text-slate-300 pl-5 list-disc text-sm md:text-base leading-relaxed">
              <li>
                <strong className="text-white">Dữ liệu kỹ thuật ẩn danh:</strong> Địa chỉ IP ẩn danh (được băm một chiều ở tầng CDN Cloudflare),
                loại trình duyệt, hệ điều hành và thời gian đọc bài viết để tính toán lưu lượng và ngăn chặn tấn công DDoS.
              </li>
              <li>
                <strong className="text-white">Dữ liệu cá nhân hóa cục bộ:</strong> Danh sách chuyên mục bạn bấm "Theo dõi" hoặc "Ẩn" được lưu trữ
                trực tiếp trên trình duyệt của bạn (Local Storage/Cookies thiết yếu), không liên kết với danh tính cá nhân.
              </li>
              <li>
                <strong className="text-white">Thông tin bạn chủ động cung cấp:</strong> Họ tên và email khi bạn gửi thư liên hệ, yêu cầu đính
                chính hoặc đăng ký nhận bản tin qua thư điện tử.
              </li>
            </ul>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              2. Cam kết không bán dữ liệu cho bên thứ ba
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-3">
              MStudio Channel <strong className="text-white">tuyệt đối không bán, cho thuê, trao đổi hoặc thương mại hóa</strong> bất kỳ thông tin
              hoặc dữ liệu hành vi đọc báo của độc giả cho các mạng lưới quảng cáo tiếp thị lại (retargeting ads) hay các
              công ty thu thập dữ liệu thứ ba.
            </p>
            <p className="text-base text-slate-300 leading-relaxed m-0">
              Dữ liệu thống kê lượt đọc chỉ phục vụ mục đích duy nhất là xếp hạng tin tức đang nóng và cải thiện chất
              lượng bài viết của ban biên tập.
            </p>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              3. Hạ tầng lưu trữ an toàn & mã hóa bảo mật
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-3">
              Hệ thống MStudio Channel được vận hành trên nền tảng Cloudflare Workers và cơ sở dữ liệu phân tán mã hóa
              ở trạng thái nghỉ (Encryption at Rest) và mã hóa trong khi truyền tải (TLS 1.3).
            </p>
            <p className="text-base text-slate-300 leading-relaxed m-0">
              Hệ thống không lưu trữ mật khẩu thuần hay thông tin nhạy cảm. Toàn bộ các kết nối API đều được bảo vệ
              bởi tường lửa chống giả mạo danh tính và giám sát bất thường tự động.
            </p>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              4. Quyền của độc giả đối với dữ liệu cá nhân
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-3">
              Theo Nghị định 13/2023/NĐ-CP của Chính phủ Việt Nam về bảo vệ dữ liệu cá nhân, bạn có toàn quyền:
            </p>
            <ul className="space-y-2 text-slate-300 pl-5 list-disc text-sm md:text-base leading-relaxed">
              <li>Yêu cầu kiểm tra, cập nhật hoặc chỉnh sửa thông tin cá nhân đã cung cấp.</li>
              <li>Yêu cầu xóa toàn bộ lịch sử thư từ hoặc thông tin liên hệ khỏi hệ thống cơ sở dữ liệu.</li>
              <li>Xóa bộ nhớ đệm (Clear cache & cookies) trên trình duyệt bất cứ lúc nào để reset toàn bộ thói quen đọc tin.</li>
            </ul>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
              5. Thông tin đầu mối phụ trách bảo vệ dữ liệu
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">
              Mọi thắc mắc hoặc yêu cầu thực thi quyền riêng tư, vui lòng liên hệ Bộ phận An toàn Thông tin:
            </p>
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl space-y-1 text-sm md:text-base">
              <div><strong className="text-white">Email chuyên trách:</strong> <a href="mailto:privacy@mstudio.minds.io.vn" className="text-cyan-400 hover:underline">privacy@mstudio.minds.io.vn</a></div>
              <div className="text-slate-300"><strong className="text-white">Địa chỉ:</strong> Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
