import { ImageResponse } from "@vercel/og";

/**
 * OG image mặc định toàn site (proposal §7).
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
        <div style={{ color: "#FFFFFF", fontSize: 36, letterSpacing: 6 }}>
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
