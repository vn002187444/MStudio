import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MStudio Channel",
  description: "MStudio Channel — tin tức evidence-first, biên tập có kiểm chứng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark">
      <head>
        {/* Brand Identity: Dynamic SVG Favicon & PWA Manifest */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#07080B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />

        {/* Preconnect & DNS-Prefetch for Core Origins */}
        <link rel="preconnect" href="https://api.mstudio.minds.io.vn" />
        <link rel="dns-prefetch" href="https://api.mstudio.minds.io.vn" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Inter font — PLAN.md primary typeface, latin + vietnamese subsets */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap&subset=latin,vietnamese"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap&subset=latin,vietnamese"
        />

        {/* Speculation Rules API for Instant Route Navigation (0ms click latency) */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: "list",
                  urls: ["/danh-cho-ban", "/chu-de"],
                },
                {
                  source: "document",
                  where: {
                    href_matches: "/bai-viet/*",
                  },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-[#07080B] text-slate-100 antialiased min-h-screen selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
