import type { Metadata } from "next";
import { StudioShell } from "../components/studio-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MStudio Studio",
  description: "MStudio Studio — newsroom nội bộ: incoming, biên tập, kiểm duyệt, xuất bản.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <StudioShell>{children}</StudioShell>
      </body>
    </html>
  );
}
