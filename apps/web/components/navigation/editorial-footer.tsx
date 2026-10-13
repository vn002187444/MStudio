import { primaryNav } from "./taxonomy";

/**
 * Editorial Footer (PLAN.md page blueprint).
 * 3-column grid: Sitemap links | About + Contact | Social icons.
 * Server Component.
 */
export function EditorialFooter() {
  return (
    <footer className="editorial-footer" role="contentinfo">
      <div className="container-content">
        <div className="footer-grid">
          {/* Column 1: Brand + Sitemap */}
          <div className="footer-col">
            <p className="brand footer-brand" translate="no">
              MSTUDIO <span>CHANNEL</span>
            </p>
            <p className="footer-tagline">
              Tạp chí tin tức công nghệ, kinh tế &amp; phân tích đa nguồn thông minh.
            </p>
            <nav aria-label="Sitemap chân trang">
              <ul className="footer-sitemap">
                {primaryNav.slice(0, 8).map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 2: About & Legal */}
          <div className="footer-col">
            <h3 className="footer-heading">Về chúng tôi</h3>
            <ul className="footer-links">
              <li>
                <a href="/gioi-thieu">Giới thiệu</a>
              </li>
              <li>
                <a href="/lien-he">Liên hệ</a>
              </li>
              <li>
                <a href="/chinh-sach-bao-mat">Chính sách bảo mật</a>
              </li>
              <li>
                <a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Social + CMS */}
          <div className="footer-col">
            <h3 className="footer-heading">Kết nối</h3>
            <div className="footer-social">
              <a href="/feed.xml" aria-label="RSS Feed" className="footer-social-link">
                {/* RSS icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 11a9 9 0 0 1 9 9" />
                  <path d="M4 4a16 16 0 0 1 16 16" />
                  <circle cx="5" cy="19" r="1" />
                </svg>
                <span>RSS</span>
              </a>
            </div>
            <a
              href="/cms"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-cms-pill"
            >
              <span aria-hidden="true">✍️</span>
              <span>Biên tập / CMS</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} MStudio Channel. Tòa soạn số đa nguồn &amp; AI
            Evidence-first.
          </p>
        </div>
      </div>
    </footer>
  );
}
