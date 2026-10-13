import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MStudio Channel",
  description: "MStudio Channel — tin tức evidence-first, biên tập có kiểm chứng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
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
      <body>{children}</body>
    </html>
  );
}
