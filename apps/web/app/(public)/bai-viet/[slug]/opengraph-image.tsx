import { ImageResponse } from "@vercel/og";

/**
 * OG cho trang bài viết (proposal §7). Tạm dùng mẫu site-wide vì route
 * OG động [slug] chưa chạy ổn trên vinext (500) — khôi phục dynamic khi
 * vinext hỗ trợ. Trang bài vẫn có metadata title/description đầy đủ.
 */
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#090909",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: 80,
          width: "100%",
        }}
      >
        <div style={{ color: "#FFFFFF", fontSize: 32, letterSpacing: 4 }}>
          MSTUDIO CHANNEL
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, marginTop: 24 }}>
          Tin tức evidence-first, biên tập có kiểm chứng.
        </div>
      </div>
    ),
    { ...size },
  );
}
