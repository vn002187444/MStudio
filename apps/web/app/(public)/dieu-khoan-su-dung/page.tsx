import type { Metadata } from "next";
import { AmbientGlow } from "@mstudio/ui";

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
      className="home-main min-h-screen bg-[#07080B] text-slate-100 relative overflow-hidden"
      id="main-content"
    >
      <AmbientGlow color="rgba(37, 99, 235, 0.15)" size={500} className="-top-32 -left-20 pointer-events-none" />
      <AmbientGlow color="rgba(245, 158, 11, 0.1)" size={400} className="top-1/2 -right-20 pointer-events-none" />

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
            <li className="text-cyan-400 font-semibold">Điều khoản sử dụng</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Điều khoản sử dụng dịch vụ
          </h1>
          <div className="text-xs text-slate-400 mb-4 font-mono">
            Có hiệu lực từ ngày: <strong className="text-slate-200">01/01/2026</strong> | Cập nhật gần nhất: <strong className="text-cyan-400">18/10/2026</strong>
          </div>
          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal m-0">
            Chào mừng bạn đến với MStudio Channel. Bằng việc truy cập, đọc hoặc chia sẻ nội dung từ trang web này,
            bạn đồng ý tuân thủ các điều khoản và quy định được nêu rõ dưới đây.
          </p>
        </header>

        {/* Content sections */}
        <div className="space-y-8">
          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              1. Chấp thuận điều khoản
            </h2>
            <p className="text-base text-slate-300 leading-relaxed m-0">
              Nếu bạn không đồng ý với bất kỳ điều khoản nào trong văn bản này, vui lòng ngưng sử dụng trang web. Chúng tôi
              có quyền sửa đổi, bổ sung các điều khoản này vào bất kỳ lúc nào để phù hợp với quy định pháp luật và hoạt động
              thực tế của tòa soạn. Các thay đổi có hiệu lực ngay khi được đăng tải công khai.
            </p>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              2. Quyền sở hữu trí tuệ & Quy định trích dẫn
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">
              Toàn bộ giao diện thiết kế, mã nguồn, biểu tượng thương hiệu, cơ sở dữ liệu và các bài viết phân tích tổng hợp
              độc quyền trên MStudio Channel đều thuộc quyền sở hữu của MStudio hoặc đã được cấp phép sử dụng hợp pháp.
            </p>
            <ul className="space-y-3 text-slate-300 pl-5 list-disc text-sm md:text-base leading-relaxed">
              <li>
                <strong className="text-white">Được phép:</strong> Các cơ quan, tổ chức, cá nhân được quyền trích dẫn phi thương mại không quá
                150 từ của bài viết, kèm theo đường dẫn liên kết (backlink) trực tiếp và ghi rõ nguồn <em className="text-cyan-300 font-medium">"Theo MStudio Channel"</em>.
              </li>
              <li>
                <strong className="text-white">Nghiêm cấm:</strong> Tự động sao chép hàng loạt (scraping), xuất bản lại nguyên văn toàn bộ bài
                viết nhằm mục đích thương mại mà chưa có sự đồng ý bằng văn bản của Ban biên tập MStudio Channel.
              </li>
            </ul>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              3. Trách nhiệm của người sử dụng
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">Khi tương tác, gửi đóng góp hoặc chia sẻ bài viết, bạn cam kết không:</p>
            <ul className="space-y-2 text-slate-300 pl-5 list-disc text-sm md:text-base leading-relaxed">
              <li>Phát tán thông tin sai lệch, xuyên tạc, xúc phạm danh dự nhân phẩm của tổ chức, cá nhân.</li>
              <li>Phát tán mã độc, virus hoặc thực hiện hành vi tấn công từ chối dịch vụ (DDoS) gây gián đoạn hệ thống.</li>
              <li>Giả mạo biên tập viên, nhà báo hoặc nhân sự của MStudio Channel dưới bất kỳ hình thức nào.</li>
            </ul>
          </section>

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              4. Miễn trừ trách nhiệm (Disclaimer)
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">
              MStudio Channel luôn nỗ lực tối đa để xác thực thông tin từ nhiều nguồn uy tín trước khi xuất bản. Tuy nhiên:
            </p>
            <ul className="space-y-2 text-slate-300 pl-5 list-disc text-sm md:text-base leading-relaxed">
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

          <section className="bg-slate-900/90 rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl backdrop-blur-xl">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
              5. Luật điều chỉnh & Giải quyết tranh chấp
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-4">
              Các điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam. Mọi tranh
              chấp phát sinh trước hết sẽ được giải quyết thông qua thương lượng hòa giải thiện chí giữa các bên.
            </p>
            <div className="p-4 bg-slate-950/80 border border-white/10 rounded-xl text-sm md:text-base text-slate-300">
              Nếu có thắc mắc về điều khoản sử dụng, vui lòng gửi email về:{" "}
              <a href="mailto:legal@mstudio.minds.io.vn" className="text-cyan-400 font-bold hover:underline">
                legal@mstudio.minds.io.vn
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
