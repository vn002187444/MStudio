import { ImageResponse } from "@vercel/og";

/**
 * MStudio Channel Master Open Graph Image (Hybrid Glassmorphic v2.0).
 * Edge-rendered 1200x630 image with Ambient Glow, Sapphire Monogram M and frosted acrylic card.
 */
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#07080B",
          position: "relative",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Ambient Glow Background Emitters */}
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "20%",
            width: "650px",
            height: "450px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "15%",
            width: "550px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Master Frosted Glass Bento Card */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "50px 60px",
            borderRadius: "28px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1.5px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            position: "relative",
          }}
        >
          {/* Top Brand Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Sapphire Monogram M Mark */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #07080B 100%)",
                  border: "1.5px solid rgba(255, 255, 255, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)",
                }}
              >
                <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
                  <path d="M22 76 V28 L40 46 V76 Z" fill="#93C5FD" />
                  <path d="M40 46 L50 36 L60 46 L50 62 Z" fill="#FFFFFF" />
                  <path d="M78 76 V28 L60 46 V76 Z" fill="#60A5FA" />
                  <path d="M22 76 L22 26 L50 56 L78 26 L78 76" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", letterSpacing: "2px" }}>
                  MSTUDIO
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    color: "#93C5FD",
                    backgroundColor: "rgba(37, 99, 235, 0.25)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(59, 130, 246, 0.35)",
                  }}
                >
                  CHANNEL
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "6px 14px",
                borderRadius: "9999px",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#34D399", letterSpacing: "1px" }}>
                LIVE PORTAL
              </span>
            </div>
          </div>

          {/* Center Editorial Focus */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#60A5FA",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              TẠP CHÍ CÔNG NGHỆ & TRÍ TUỆ NHÂN TẠO THẾ HỆ MỚI
            </div>
            <div
              style={{
                fontSize: "46px",
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.22,
                letterSpacing: "-0.5px",
              }}
            >
              Khám phá thông tin qua lăng kính AI. Dữ liệu thời gian thực & minh bạch nguồn gốc.
            </div>
          </div>

          {/* Bottom Trust & Lineage Strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "24px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>
                ◎ Chuẩn kiểm chứng Fact-Check
              </span>
              <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>
                ⚡ Cloudflare Edge Zero-Latency
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 500 }}>
              mstudio.vn002187444.workers.dev
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
