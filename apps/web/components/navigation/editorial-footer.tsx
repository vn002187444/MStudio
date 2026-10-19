import { BentoGrid, BentoCard, BrandLogo } from "@mstudio/ui";

/**
 * Editorial Deep Void Bento Footer (MST-110).
 * Displays branding, sitemap, transparency manifest.
 * Full Dual-Theme Support: Obsidian Void (Dark) & Solar Frosted (Light).
 * Server Component.
 */
export function EditorialFooter() {
  return (
    <footer className="editorial-footer w-full bg-[var(--void-deep)] text-[var(--solar-light)] pt-16 pb-24 border-t border-[var(--void-surface)] mt-24 transition-colors duration-300">
      <div className="container-content max-w-[var(--container)] mx-auto px-4 md:px-8">
        <BentoGrid className="mb-12">
          {/* Brand Col */}
          <BentoCard colSpan={4} className="footer-card bg-[var(--void-surface)] border-white/5 p-8 flex flex-col justify-between transition-colors duration-300 shadow-xl">
            <div>
              <div className="mb-6 footer-brand-container">
                <BrandLogo variant="channel" size="lg" isDark={true} className="footer-brand-logo" />
              </div>
              <p className="footer-desc text-white/60 text-sm leading-relaxed mb-6 max-w-sm">
                Tạp chí công nghệ, kinh tế và trí tuệ nhân tạo thế hệ mới. Tiên phong áp dụng AI trong kiểm chứng và xuất bản tin tức theo thời gian thực.
              </p>
            </div>
            
            <a
              href="/cms"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-cms-btn inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all text-white shadow-sm"
            >
              <span aria-hidden="true">✍️</span>
              Cổng Biên tập Studio CMS
            </a>
          </BentoCard>

          {/* Sitemap Col */}
          <BentoCard colSpan={4} className="footer-card bg-[var(--void-surface)] border-white/5 p-8 transition-colors duration-300 shadow-xl">
            <h3 className="footer-heading text-sm font-bold uppercase tracking-widest text-white/40 mb-6">Khám phá</h3>
            <ul className="footer-links columns-2 gap-4 text-sm font-medium">
              {[
                { href: "/moi-nhat", label: "Tin mới nhất" },
                { href: "/cong-nghe", label: "Công nghệ" },
                { href: "/kinh-doanh", label: "Kinh doanh" },
                { href: "/the-gioi", label: "Thế giới" },
                { href: "/ai-channel", label: "AI Channel" },
                { href: "/khoa-hoc", label: "Khoa học" },
                { href: "/xe", label: "Xe" },
                { href: "/doi-song", label: "Đời sống" },
              ].map((link) => (
                <li key={link.href} className="mb-3 break-inside-avoid">
                  <a href={link.href} className="text-white/70 hover:text-white transition-colors">{link.label}</a>
                </li>
              ))}
            </ul>
          </BentoCard>

          {/* Legal / Social Col */}
          <BentoCard colSpan={4} className="footer-card bg-[var(--void-surface)] border-white/5 p-8 transition-colors duration-300 shadow-xl">
            <h3 className="footer-heading text-sm font-bold uppercase tracking-widest text-white/40 mb-6">MStudio Lineage</h3>
            <p className="footer-desc text-xs text-white/50 leading-relaxed mb-6">
              Nội dung được tổng hợp đa nguồn và đối chiếu sự thật bằng mô hình ngôn ngữ lớn (LLM). Mọi sự can thiệp từ ban biên tập đều được ghi nhận vào Lineage Manifest.
            </p>
            
            <h3 className="footer-heading text-sm font-bold uppercase tracking-widest text-white/40 mb-4 mt-8">Thông tin</h3>
            <ul className="footer-links space-y-2 text-sm font-medium">
              <li><a href="/gioi-thieu" className="text-white/70 hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="/chinh-sach-bao-mat" className="text-white/70 hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="/dieu-khoan-su-dung" className="text-white/70 hover:text-white transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="/lien-he" className="text-white/70 hover:text-white transition-colors">Liên hệ tòa soạn</a></li>
            </ul>
          </BentoCard>
        </BentoGrid>

        <div className="footer-bottom pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-medium transition-colors">
          <p>© {new Date().getFullYear()} MStudio Channel. Phiên bản hệ thống: v2.0 (Hybrid Glassmorphic).</p>
          <div className="flex gap-4">
            <span>Powered by Cloudflare Workers & Vinext</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
