"use client";

import { useCmsToken, TokenGate } from "../../components/cms-actions";

export default function SettingsPage() {
  const [token, setToken] = useCmsToken();

  return (
    <main style={{ paddingBottom: 48, maxWidth: 800 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px", fontWeight: 700 }}>
          Settings &amp; Configuration
        </h1>
        <p style={{ color: "var(--gray)", margin: 0, fontSize: "var(--text-sm)" }}>
          Cài đặt hệ thống MStudio Studio, quản lý Bearer Token và liên kết API
        </p>
      </div>

      <TokenGate>
        {/* Token Management Card */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
            Phiên Đăng Nhập &amp; Bearer Token Biên Tập
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>
            Token định danh quyền hạn Admin/Editor trong Database D1. Được lưu trữ cục bộ an toàn trên trình duyệt của bạn (`localStorage`).
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Dán token biên tập…"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            />
            <button
              type="button"
              onClick={() => setToken("")}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#fef2f2",
                color: "#dc2626",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Cloudflare Free Tier Status */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
            Hạn Mức Cloudflare Free-Tier &amp; Gemini AI
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
            <div style={{ padding: 14, border: "1px solid #f1f5f9", borderRadius: 10, background: "#f8fafc" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>D1 Read Budget</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>5,000,000 rows/ngày</div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Chi phí: $0.00</div>
            </div>
            <div style={{ padding: 14, border: "1px solid #f1f5f9", borderRadius: 10, background: "#f8fafc" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Gemini 2.5 Flash</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>1,500 req/ngày</div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Free Tier (Google AI Studio)</div>
            </div>
            <div style={{ padding: 14, border: "1px solid #f1f5f9", borderRadius: 10, background: "#f8fafc" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>Workers AI (@cf/llama)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#7c3af2", marginTop: 4 }}>10,000 neurons/ngày</div>
              <div style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}>Edge Processing</div>
            </div>
          </div>
        </div>
      </TokenGate>
    </main>
  );
}
