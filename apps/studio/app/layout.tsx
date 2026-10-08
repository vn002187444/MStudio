import type { Metadata } from "next";
import { StudioNav } from "../components/studio-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "MStudio Studio",
  description: "MStudio Studio — newsroom nội bộ: incoming, biên tập, kiểm duyệt, xuất bản.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <div
          style={{
            background: "var(--soft)",
            color: "var(--ink)",
            display: "grid",
            fontFamily: "var(--font-sans)",
            gridTemplateColumns: "240px 1fr",
            minHeight: "100vh",
          }}
        >
          <aside
            aria-label="Điều hướng Studio"
            style={{ background: "var(--black)", color: "var(--white)", padding: 16 }}
          >
            <p style={{ fontWeight: 800, letterSpacing: "0.04em", margin: "0 0 16px" }}>
              MSTUDIO <span style={{ fontWeight: 400 }}>STUDIO</span>
            </p>
            <StudioNav />
          </aside>
          <div style={{ margin: "0 auto", maxWidth: "var(--max-content-width)", padding: 24, width: "100%" }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
