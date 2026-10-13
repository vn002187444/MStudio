"use client";

import { useEffect, useState } from "react";
import { TokenGate } from "../../components/cms-actions";
import { apiBaseUrl } from "../../lib/cms";

interface MediaItem {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  category: string;
}

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMedia() {
      try {
        const res = await fetch(`${apiBaseUrl()}/articles?limit=30`, { cache: "no-store" });
        if (res.ok) {
          const payload = (await res.json()) as {
            rows?: Array<{
              id: string;
              title?: string;
              slug?: string;
              hero_image_url?: string;
              og_image_url?: string;
              category_slug?: string;
            }>;
          };
          if (Array.isArray(payload.rows)) {
            const items: MediaItem[] = [];
            for (const r of payload.rows) {
              const img = r.hero_image_url || r.og_image_url;
              if (img) {
                items.push({
                  id: r.id,
                  title: r.title || r.slug || r.id,
                  slug: r.slug || r.id,
                  imageUrl: img,
                  category: r.category_slug || "media",
                });
              }
            }
            setMediaItems(items);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    loadMedia();
  }, []);

  function handleCopyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>
                Thư viện Ảnh Bìa &amp; Thumbnail Đang Sử Dụng ({mediaItems.length} media)
              </h2>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
                Ảnh được AI trích xuất và tối ưu hóa từ bài viết đã xuất bản
              </p>
            </div>
            <a
              href="/editor"
              style={{
                padding: "8px 16px",
                background: "#2563eb",
                color: "#fff",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              + Đăng ảnh mới
            </a>
          </div>

          {loading ? (
            <p style={{ color: "var(--gray)", fontSize: 14 }}>Đang tải danh sách media từ D1…</p>
          ) : mediaItems.length === 0 ? (
            <p style={{ color: "var(--gray)", fontSize: 14 }}>Chưa có bài viết nào đính kèm ảnh đại diện.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: 130, background: "#e2e8f0" }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8, lineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item.imageUrl, item.id)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {copiedId === item.id ? "✓ Đã copy!" : "📋 Copy URL"}
                      </button>
                      <a
                        href={`/editor?article=${item.id}`}
                        style={{
                          padding: "6px 8px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#2563eb",
                          textDecoration: "none",
                        }}
                      >
                        Sửa bài
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TokenGate>
    </main>
  );
}
