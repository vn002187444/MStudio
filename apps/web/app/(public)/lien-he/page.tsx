import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { AmbientGlow } from "@mstudio/ui";

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
            <li className="text-cyan-400 font-semibold">Liên hệ</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Liên hệ & Đóng góp ý kiến
          </h1>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal m-0 max-w-3xl">
            Ban biên tập MStudio Channel luôn sẵn sàng lắng nghe mọi ý kiến đóng góp, phản hồi về tính chuẩn xác của
            thông tin, hoặc đề xuất hợp tác từ độc giả và đối tác báo chí.
          </p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Contact Info (5 cols) */}
          <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-3">
                Thông tin tòa soạn
              </h2>

              <div className="space-y-6 text-sm">
                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    <span>🏢</span> Tòa soạn MStudio Channel
                  </div>
                  <div className="text-slate-300 leading-relaxed">
                    Khu Công nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    <span>📧</span> Thư điện tử (Email)
                  </div>
                  <div>
                    <a href="mailto:contact@mstudio.minds.io.vn" className="text-cyan-400 hover:underline font-medium">
                      contact@mstudio.minds.io.vn
                    </a>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    (Tiếp nhận thông cáo báo chí, yêu cầu bản quyền & hợp tác)
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    <span>📞</span> Đường dây nóng độc giả
                  </div>
                  <div className="text-white font-bold text-base">
                    (+84) 28 3822 6886
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    (Hỗ trợ 24/7 đối với thông tin phản ánh khẩn cấp)
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    <span>⚖️</span> Đính chính & Khiếu nại thông tin
                  </div>
                  <div>
                    <a href="mailto:corrections@mstudio.minds.io.vn" className="text-cyan-400 hover:underline font-medium">
                      corrections@mstudio.minds.io.vn
                    </a>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Cam kết xử lý và phản hồi trong vòng tối đa 24 giờ làm việc.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-950/60 to-slate-900/90 border border-blue-500/30 rounded-2xl p-6 shadow-xl text-sm leading-relaxed text-slate-200">
              <strong className="text-cyan-300 block mb-2 font-bold text-base">💡 Bạn có nguồn tin hoặc video thời sự muốn chia sẻ?</strong>
              <p className="m-0 text-slate-300">
                MStudio cam kết bảo mật danh tính nguồn tin theo đúng đạo đức báo chí nghề nghiệp.
              </p>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="col-span-12 md:col-span-7">
            <div className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
              <h2 className="text-xl font-bold text-white mb-2">
                Gửi tin nhắn trực tiếp
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Điền thông tin vào mẫu bên dưới, chúng tôi sẽ liên hệ lại với bạn sớm nhất.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
