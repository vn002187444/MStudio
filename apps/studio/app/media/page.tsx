"use client";

import { TokenGate } from "../../components/cms-actions";

export default function MediaPage() {
  return (
    <main style={{ paddingBottom: 48 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px", fontWeight: 700 }}>Media Asset Manager</h1>
        <p style={{ color: "var(--gray)", margin: 0, fontSize: "var(--text-sm)" }}>
          Quản lý tài nguyên media, bucket Cloudflare R2 (`mstudio-raw` / `mstudio-media`) và phòng chống chặn hotlink
        </p>
      </div>

      <TokenGate>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>R2 Storage Bucket</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>mstudio-raw</div>
            <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>✓ Active (Cloudflare Free Tier)</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Chính sách Hotlink</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>Auto Rehost</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Tự động tải về R2 để chống lỗi 403 Forbidden</div>
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Định dạng ảnh tối ưu</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#7c3af2", marginTop: 4 }}>WebP / AVIF</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Nén ảnh siêu nhẹ không hao hụt băng thông</div>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Thư viện Media Đã Tải Lên R2</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            Toàn bộ ảnh đại diện bài viết được đồng bộ tự động khi duyệt tin tại <a href="/newsroom/incoming" style={{ color: "#2563eb" }}>Incoming</a> hoặc tải lên trong <a href="/editor" style={{ color: "#2563eb" }}>Article Editor</a>.
          </p>
        </div>
      </TokenGate>
    </main>
  );
}
