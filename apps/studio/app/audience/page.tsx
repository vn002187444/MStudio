"use client";

import { useEffect, useState } from "react";
import { apiBaseUrl, formatTime, webBaseUrl } from "../../lib/cms";
import { authedFetch, useCmsToken, TokenGate } from "../../components/cms-actions";

interface TopArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  views: number;
  reads: number;
  completionRate: number;
  publishedAt: string;
}

export default function AudiencePage() {
  const [token] = useCmsToken();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");
  const [stats, setStats] = useState({
    totalViews: 0,
    meaningfulReads: 0,
    completionRate: 0,
    shares: 0,
    bookmarks: 0,
  });
  const [topArticles, setTopArticles] = useState<TopArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [overviewRes, topRes] = await Promise.all([
          fetch(`${apiBaseUrl()}/analytics/overview`, { cache: "no-store" }),
          fetch(`${apiBaseUrl()}/analytics/top-articles?limit=15`, { cache: "no-store" }),
        ]);

        if (overviewRes.ok) {
          const overviewData = (await overviewRes.json()) as {
            overview?: {
              totalViews?: number;
              meaningfulReads?: number;
              shares?: number;
              bookmarks?: number;
            };
          };
          const ov = overviewData.overview || {};
          const totalViews = Number(ov.totalViews ?? 0);
          const meaningfulReads = Number(ov.meaningfulReads ?? 0);
          const completionRate =
            totalViews > 0
              ? Math.round((meaningfulReads / totalViews) * 1000) / 10
              : 0;

          setStats({
            totalViews,
            meaningfulReads,
            completionRate,
            shares: Number(ov.shares ?? 0),
            bookmarks: Number(ov.bookmarks ?? 0),
          });
        }

        if (topRes.ok) {
          const topData = (await topRes.json()) as {
            rows?: Array<{
              id: string;
              title: string;
              slug: string;
              categorySlug?: string;
              createdAt: string;
              views?: number;
              reads?: number;
            }>;
          };

          if (Array.isArray(topData.rows)) {
            const mapped = topData.rows.map((row) => {
              const views = Number(row.views ?? 0);
              const reads = Number(row.reads ?? 0);
              const completionRate =
                views > 0 ? Math.round((reads / views) * 100) : 0;
              return {
                id: row.id,
                title: row.title || row.slug || row.id,
                slug: row.slug || row.id,
                category: row.categorySlug || "tin-tuc",
                views,
                reads,
                completionRate,
                publishedAt: row.createdAt,
              };
            });
            setTopArticles(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, timeRange]);

  return (
    <main style={{ paddingBottom: 48 }}>
      {/* iOS Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Audience &amp; Analytics
          </h1>
          <p style={{ color: "var(--gray)", margin: 0, fontSize: "var(--text-sm)" }}>
            Đo lường lượng xem (Views), đọc sâu (Meaningful Reads) và mức độ giữ chân độc giả
          </p>
        </div>

        {/* iOS Segmented Control */}
        <div
          role="group"
          aria-label="Khung thời gian"
          style={{
            background: "#f1f5f9",
            padding: 3,
            borderRadius: 9999,
            display: "inline-flex",
            border: "1px solid #e2e8f0",
          }}
        >
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              type="button"
              style={{
                border: "none",
                background: timeRange === range ? "#ffffff" : "transparent",
                color: timeRange === range ? "#0f172a" : "#64748b",
                fontWeight: 600,
                fontSize: 13,
                padding: "6px 16px",
                borderRadius: 9999,
                cursor: "pointer",
                boxShadow: timeRange === range ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {range === "24h" ? "24 Giờ qua" : range === "7d" ? "7 Ngày qua" : "30 Ngày qua"}
            </button>
          ))}
        </div>
      </div>

      <TokenGate>
        {/* iOS Metric Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>
              Lượt mở bài (Article Views)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
              {stats.totalViews.toLocaleString("vi-VN")}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
              Dữ liệu ghi nhận thực tế
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>
              Đọc sâu (Meaningful Reads ≥30s)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb", letterSpacing: "-0.03em" }}>
              {stats.meaningfulReads.toLocaleString("vi-VN")}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
              Độc giả đọc trên 30 giây
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>
              Tỷ lệ đọc hết (Completion Rate)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em" }}>
              {stats.completionRate}%
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Mục tiêu tòa soạn: &gt;60%
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 6 }}>
              Lưu &amp; Chia sẻ (Share &amp; Save)
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#7c3af2", letterSpacing: "-0.03em" }}>
              {(stats.shares + stats.bookmarks).toLocaleString("vi-VN")}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {stats.shares} shares · {stats.bookmarks} bookmarks
            </div>
          </div>
        </div>

        {/* Top Articles Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0f172a" }}>
                Top Bài Viết Đọc Nhiều Nhất
              </h2>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>
                Xếp hạng dựa trên lượng độc giả thực tế và tỷ lệ đọc hết nội dung
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                background: "#f1f5f9",
                color: "#475569",
                padding: "4px 10px",
                borderRadius: 9999,
              }}
            >
              Real-time D1 Events
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "12px 20px" }}># Hạng</th>
                <th style={{ padding: "12px 20px" }}>Tiêu đề bài viết</th>
                <th style={{ padding: "12px 20px" }}>Chuyên mục</th>
                <th style={{ padding: "12px 20px", textAlign: "right" }}>Lượt xem</th>
                <th style={{ padding: "12px 20px", textAlign: "right" }}>Đọc sâu</th>
                <th style={{ padding: "12px 20px", textAlign: "right" }}>Tỷ lệ đọc</th>
                <th style={{ padding: "12px 20px", textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {topArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>
                    {loading ? "Đang tổng hợp dữ liệu sự kiện…" : "Chưa có đủ lượt đọc để xếp hạng"}
                  </td>
                </tr>
              ) : (
                topArticles.map((article, index) => (
                  <tr
                    key={article.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: index < 3 ? "#2563eb" : "#64748b" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "14px 20px", maxWidth: 360 }}>
                      <a
                        href={`${webBaseUrl()}/bai-viet/${article.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#0f172a",
                          textDecoration: "none",
                          fontWeight: 500,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.title}
                      </a>
                      <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginTop: 2 }}>
                        {formatTime(article.publishedAt)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontWeight: 500,
                        }}
                      >
                        {article.category}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#0f172a" }}>
                      {article.views.toLocaleString("vi-VN")}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#2563eb", fontWeight: 500 }}>
                      {article.reads.toLocaleString("vi-VN")}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: article.completionRate > 70 ? "#16a34a" : "#ca8a04" }}>
                          {article.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      <a
                        href={`/editor`}
                        style={{
                          fontSize: 12,
                          color: "#2563eb",
                          textDecoration: "none",
                          fontWeight: 500,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Chỉnh sửa
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TokenGate>
    </main>
  );
}
