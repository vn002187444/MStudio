import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MStudio Channel",
  description: "MStudio Channel — tin tức evidence-first, biên tập có kiểm chứng.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
