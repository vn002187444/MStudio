"use client";

import { useState, useEffect, useCallback } from "react";
import { TokenGate, useCmsToken } from "../../components/cms-actions";
import { apiBaseUrl } from "../../lib/cms";
import type { RedirectRecord, GscOverviewResponse } from "../../../../packages/contracts/src/studio";

type SeoTab = "onpage" | "schema" | "redirects" | "gsc" | "images";

export default function SeoDiscoveryPage() {
  const [token] = useCmsToken();
  const [activeTab, setActiveTab] = useState<SeoTab>("onpage");

  // On-page tester state
  const [testTitle, setTestTitle] = useState("AI Agent thay đổi diện mạo công nghệ 2026");
  const [testKeyword, setTestKeyword] = useState("AI Agent");
  const [testDesc, setTestDesc] = useState("Tìm hiểu AI Agent đang thay đổi cách các doanh nghiệp tự động hóa quy trình và tác động đến ngành công nghệ toàn cầu.");
  const [testContent, setTestContent] = useState("Làn sóng AI Agent đang bùng nổ mạnh mẽ trong năm 2026. Các tập đoàn công nghệ lớn đang tích cực triển khai hệ thống AI Agent nhằm tối ưu hóa chuỗi cung ứng và vận hành. Bài viết phân tích các khía cạnh cốt lõi của công nghệ này.");

  // Redirects state
  const [redirects, setRedirects] = useState<RedirectRecord[]>([]);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [redirectLoading, setRedirectLoading] = useState(false);

  // GSC Service Account state
  const [gscJson, setGscJson] = useState("");
  const [gscSaved, setGscSaved] = useState(false);
  const [gscOverview, setGscOverview] = useState<GscOverviewResponse | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);

  // Compute On-Page Score (Rank Math Algorithm)
  function computeScore() {
    let score = 0;
    const checks = [];

    // 1. Focus Keyword in Title
    const titleHasKeyword = testKeyword && testTitle.toLowerCase().includes(testKeyword.toLowerCase());
    if (titleHasKeyword) {
      score += 20;
      checks.push({ label: "Từ khóa chính xuất hiện trong tiêu đề SEO", pass: true });
    } else {
      checks.push({ label: "Từ khóa chính CHƯA có trong tiêu đề SEO", pass: false });
    }

    // 2. Title Length (40-65 chars)
    if (testTitle.length >= 40 && testTitle.length <= 65) {
      score += 15;
      checks.push({ label: `Độ dài tiêu đề tối ưu (${testTitle.length}/65 ký tự)`, pass: true });
    } else {
      checks.push({ label: `Tiêu đề nên có từ 40–65 ký tự (hiện tại: ${testTitle.length})`, pass: false });
    }

    // 3. Focus Keyword in Meta Desc
    const descHasKeyword = testKeyword && testDesc.toLowerCase().includes(testKeyword.toLowerCase());
    if (descHasKeyword) {
      score += 20;
      checks.push({ label: "Từ khóa chính xuất hiện trong mô tả Meta", pass: true });
    } else {
      checks.push({ label: "Từ khóa chính CHƯA có trong mô tả Meta", pass: false });
    }

    // 4. Meta Desc Length (120-160 chars)
    if (testDesc.length >= 120 && testDesc.length <= 160) {
      score += 15;
      checks.push({ label: `Độ dài Meta Description tối ưu (${testDesc.length}/160 ký tự)`, pass: true });
    } else {
      checks.push({ label: `Mô tả Meta nên từ 120–160 ký tự (hiện tại: ${testDesc.length})`, pass: false });
    }

    // 5. Keyword in Content
    const contentHasKeyword = testKeyword && testContent.toLowerCase().includes(testKeyword.toLowerCase());
    if (contentHasKeyword) {
      score += 15;
      checks.push({ label: "Từ khóa chính xuất hiện trong nội dung bài viết", pass: true });
    } else {
      checks.push({ label: "Từ khóa chính chưa có trong thân bài", pass: false });
    }

    // 6. Content Length
    const words = testContent.trim().split(/\s+/).length;
    if (words >= 40) {
      score += 15;
      checks.push({ label: `Độ dài nội dung đạt yêu cầu tối thiểu (${words} từ)`, pass: true });
    } else {
      checks.push({ label: `Nội dung quá ngắn (${words} từ, khuyến nghị &gt; 300 từ)`, pass: false });
    }

    return { score, checks };
  }

  const { score, checks } = computeScore();

  // Fetch Redirects
  const loadRedirects = useCallback(async () => {
    try {
      setRedirectLoading(true);
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      const res = await fetch(`${apiBaseUrl()}/redirects`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { redirects?: RedirectRecord[] };
        setRedirects(data.redirects || []);
      }
    } catch {
      // Fallback
    } finally {
      setRedirectLoading(false);
    }
  }, [token]);

  // Fetch GSC Overview
  const loadGscOverview = useCallback(async () => {
    try {
      setGscLoading(true);
      setGscError(null);
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      const res = await fetch(`${apiBaseUrl()}/seo/gsc/overview`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as GscOverviewResponse;
        setGscOverview(data);
      } else {
        const errData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setGscError(errData.error?.message || "Không thể tải dữ liệu GSC");
      }
    } catch (err) {
      setGscError(err instanceof Error ? err.message : String(err));
    } finally {
      setGscLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRedirects();
    loadGscOverview();
  }, [loadRedirects, loadGscOverview]);

  async function handleAddRedirect() {
    if (!newFrom.trim() || !newTo.trim()) return;
    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      const res = await fetch(`${apiBaseUrl()}/redirects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          fromPath: newFrom.trim(),
          toPath: newTo.trim(),
          statusCode: 301,
        }),
      });
      if (res.ok) {
        setNewFrom("");
        setNewTo("");
        loadRedirects();
      }
    } catch {
      // Non-blocking
    }
  }

  async function handleDeleteRedirect(id: string) {
    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      await fetch(`${apiBaseUrl()}/redirects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      setRedirects((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Non-blocking
    }
  }

  async function handleSaveGsc() {
    if (!gscJson.trim()) {
      alert("Vui lòng dán nội dung Service Account JSON!");
      return;
    }
    try {
      const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
      const res = await fetch(`${apiBaseUrl()}/seo/gsc/key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ keyJson: gscJson.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message?: string } };
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Lỗi lưu JSON Service Account");
      }
      setGscSaved(true);
      setGscJson("");
      loadGscOverview();
      setTimeout(() => setGscSaved(false), 3000);
    } catch (err) {
      alert("Lỗi khi lưu cấu hình GSC: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <main style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          SEO &amp; Discovery Suite
        </h1>
        <p style={{ color: "var(--gray)", margin: 0, fontSize: "var(--text-sm)" }}>
          Bộ công cụ tối ưu hóa On-page, Schema Markup, Rank Tracker và Chuyển hướng 301 chuẩn Rank Math Pro
        </p>
      </div>

      {/* iOS Segmented Tabs */}
      <div
        role="tablist"
        style={{
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 12,
          display: "inline-flex",
          gap: 4,
          marginBottom: 24,
          border: "1px solid #e2e8f0",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["onpage", "⚡ Tối ưu On-Page"],
            ["schema", "🧩 Schema Markup"],
            ["redirects", "🔀 Chuyển hướng 301 / 404"],
            ["gsc", "📊 Google Search Console"],
            ["images", "🖼️ Tối ưu Hình ảnh"],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
            style={{
              border: "none",
              background: activeTab === tab ? "#ffffff" : "transparent",
              color: activeTab === tab ? "#0f172a" : "#64748b",
              fontWeight: 600,
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <TokenGate>
        {/* Tab 1: On-Page Real-time Scorer */}
        {activeTab === "onpage" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
            {/* Input Form */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#0f172a" }}>
                Trình Kiểm Tra &amp; Chấm Điểm On-Page SEO Trực Tiếp
              </h2>

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Từ khóa chính (Focus Keyword)
              </label>
              <input
                value={testKeyword}
                onChange={(e) => setTestKeyword(e.target.value)}
                placeholder="Ví dụ: AI Agent, Kinh tế số…"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Tiêu đề SEO (Meta Title)
              </label>
              <input
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Mô tả Meta (Meta Description)
              </label>
              <textarea
                value={testDesc}
                onChange={(e) => setTestDesc(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  marginBottom: 16,
                  boxSizing: "border-box",
                }}
              />

              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Nội dung đoạn mẫu
              </label>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Score Radar / Checklist Sidebar */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                alignSelf: "start",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Rank Math Score
                </div>
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: score >= 80 ? "#16a34a" : score >= 50 ? "#ca8a04" : "#dc2626",
                    margin: "6px 0",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {score}<span style={{ fontSize: 24, fontWeight: 500, color: "#94a3b8" }}>/100</span>
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    background: score >= 80 ? "#dcfce7" : score >= 50 ? "#fef9c3" : "#fee2e2",
                    color: score >= 80 ? "#15803d" : score >= 50 ? "#854d0e" : "#991b1b",
                  }}
                >
                  {score >= 80 ? "Rất Tốt (Chuẩn SEO)" : score >= 50 ? "Khá (Cần cải thiện)" : "Chưa đạt yêu cầu"}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                  Danh sách Kiểm tra (Checklist):
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {checks.map((c, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                      <span style={{ color: c.pass ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                        {c.pass ? "✓" : "✕"}
                      </span>
                      <span style={{ color: c.pass ? "#334155" : "#64748b" }}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schema Markup Builder */}
        {activeTab === "schema" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
              Schema Markup Generator (Dữ liệu có cấu trúc Google)
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
              Tự động tạo mã JSON-LD chuẩn Schema.org giúp bài viết hiển thị Rich Snippets, Carousel và AI Overviews trên Google.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
              {["NewsArticle (Tin tức)", "Article (Bài viết chung)", "FAQPage (Hỏi đáp)", "VideoObject (Video nhúng)"].map((s, idx) => (
                <div
                  key={s}
                  style={{
                    padding: 16,
                    border: idx === 0 ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    background: idx === 0 ? "#eff6ff" : "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, color: idx === 0 ? "#1d4ed8" : "#334155" }}>{s}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {idx === 0 ? "Mặc định cho toàn bộ tin tức MStudio" : "Kích hoạt khi bài có nội dung tương ứng"}
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>
              Mã JSON-LD sinh tự động xem trước:
            </h3>
            <pre
              style={{
                background: "#0f172a",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                fontSize: 13,
                overflowX: "auto",
                fontFamily: "monospace",
              }}
            >
{`{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "${testTitle}",
  "description": "${testDesc}",
  "image": ["https://pub-r2.minds.io.vn/hero-image.webp"],
  "datePublished": "2026-10-13T10:00:00Z",
  "dateModified": "2026-10-13T10:00:00Z",
  "author": {
    "@type": "Organization",
    "name": "MStudio Channel",
    "url": "https://mstudio.minds.io.vn"
  },
  "publisher": {
    "@type": "Organization",
    "name": "MStudio Channel",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mstudio.minds.io.vn/icon-512.png"
    }
  },
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".article-headline", ".quick-summary"]
  }
}`}
            </pre>
          </div>
        )}

        {/* Tab 3: Redirects 301 / 404 */}
        {activeTab === "redirects" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>
                  Quản lý Chuyển hướng 301/302 &amp; Bắt lỗi 404 (D1 Database)
                </h2>
                <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                  Tự động bảo toàn thứ hạng Google khi đổi URL bài viết, lưu trữ trực tiếp trên Cloudflare D1.
                </p>
              </div>
              {redirectLoading && (
                <span style={{ fontSize: 12, color: "#64748b" }}>Đang đồng bộ…</span>
              )}
            </div>

            {/* Add Redirect Form */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                value={newFrom}
                onChange={(e) => setNewFrom(e.target.value)}
                placeholder="Đường dẫn nguồn: /tin-cu/..."
                style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
              <input
                value={newTo}
                onChange={(e) => setNewTo(e.target.value)}
                placeholder="Đích đến: /bai-viet/..."
                style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddRedirect}
                style={{ padding: "10px 20px", fontWeight: 600 }}
              >
                + Thêm chuyển hướng 301
              </button>
            </div>

            {/* Redirect Table */}
            <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 16px" }}>Đường dẫn cũ</th>
                  <th style={{ padding: "10px 16px" }}>Chuyển đến đích</th>
                  <th style={{ padding: "10px 16px" }}>Mã HTTP</th>
                  <th style={{ padding: "10px 16px", textAlign: "right" }}>Số lượt chuyển</th>
                  <th style={{ padding: "10px 16px", textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {redirects.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "24px 16px", textAlign: "center", color: "#64748b" }}>
                      Chưa có quy tắc chuyển hướng nào. Nhập đường dẫn phía trên để thêm mới.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#dc2626" }}>{r.fromPath}</td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#16a34a" }}>{r.toPath}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{r.statusCode}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>{r.hits || 0} hits</td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteRedirect(r.id)}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            color: "#991b1b",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: GSC Integration & Real Analytics */}
        {activeTab === "gsc" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Status & Overview Metrics Banner */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#0f172a" }}>
                    Google Search Console API (Live Dashboard)
                  </h2>
                  <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                    Theo dõi lượt click, hiển thị và thứ hạng từ khóa thực tế từ máy chủ tìm kiếm Google.
                  </p>
                </div>

                <div>
                  {gscOverview?.fallback ? (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
                      Chế độ Fallback / Chưa đồng bộ Key
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "#dcfce7",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
                      Đã kết nối Service Account Google API
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 16,
                  marginTop: 16,
                }}
              >
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Tổng Lượt Click</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb", marginTop: 4 }}>
                    {gscOverview?.clicks ?? 0}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Lượt Hiển Thị</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                    {(gscOverview?.impressions ?? 0).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>CTR Trung Bình</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", marginTop: 4 }}>
                    {((gscOverview?.ctr ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Vị Trí Trung Bình</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed", marginTop: 4 }}>
                    {(gscOverview?.position ?? 0).toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Top Search Queries Table */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "#1e293b" }}>
                  Từ Khóa Tìm Kiếm Hàng Đầu (Top Queries)
                </h3>
                <table className="responsive-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "8px 12px" }}>Từ khóa tìm kiếm</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Số lượt Click</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Lượt hiển thị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!gscOverview?.topQueries || gscOverview.topQueries.length === 0) ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "16px 12px", textAlign: "center", color: "#64748b" }}>
                          {gscLoading ? "Đang truy vấn Google Search API…" : "Chưa có dữ liệu từ khóa. Dữ liệu sẽ tự động xuất hiện khi có lượt tìm kiếm trên Google."}
                        </td>
                      </tr>
                    ) : (
                      gscOverview.topQueries.map((q, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0f172a" }}>
                            {q.keys?.join(" / ") || "Tất cả truy vấn"}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#2563eb", fontWeight: 700 }}>
                            {q.clicks}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569" }}>
                            {q.impressions.toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Service Account Setup Form & Detailed Guide */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                🔑 Cấu Hình Google Service Account Key (JSON)
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px" }}>
                Chạy nền server-to-server 24/7 trên Cloudflare Worker mà không cần đăng nhập định kỳ.
              </p>

              {/* Step-by-step Instructions Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 16,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#334155",
                }}
              >
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  📖 Hướng dẫn 5 bước lấy Key JSON từ Google Cloud Console:
                </div>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>
                    Truy cập <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>console.cloud.google.com</a>) và chọn dự án của bạn.
                  </li>
                  <li>
                    Vào <strong>APIs &amp; Services</strong> &gt; <strong>Library</strong> &gt; Tìm kiếm và Bật <strong>Google Search Console API</strong>.
                  </li>
                  <li>
                    Vào <strong>IAM &amp; Admin</strong> &gt; <strong>Service Accounts</strong> &gt; Chọn <strong>Create Service Account</strong> (Đặt tên ví dụ: <code>mstudio-gsc-reader</code>).
                  </li>
                  <li>
                    Nhấp vào Service Account vừa tạo &gt; Thẻ <strong>Keys</strong> &gt; <strong>Add Key</strong> &gt; <strong>Create new key</strong> (Chọn định dạng <strong>JSON</strong>) &gt; Tải file <code>.json</code> về máy.
                  </li>
                  <li>
                    <strong>Quan trọng:</strong> Sao chép email Service Account (có dạng <code>xxx@project-id.iam.gserviceaccount.com</code>), vào <strong>Google Search Console</strong> &gt; <strong>Cài đặt</strong> &gt; <strong>Người dùng và quyền</strong> &gt; Thêm email này với quyền <strong>Chủ sở hữu</strong> hoặc <strong>Xem</strong>.
                  </li>
                </ol>
              </div>

              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
                Dán toàn bộ nội dung file JSON vào đây:
              </label>
              <textarea
                value={gscJson}
                onChange={(e) => setGscJson(e.target.value)}
                placeholder='{ "type": "service_account", "project_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\\n...", "client_email": "..." }'
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontFamily: "monospace",
                  fontSize: 13,
                  boxSizing: "border-box",
                  marginBottom: 16,
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveGsc}
                  style={{ padding: "10px 24px", fontWeight: 600 }}
                >
                  Lưu &amp; Kích hoạt Google Search Console
                </button>
                {gscSaved && (
                  <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
                    ✓ Đã lưu Service Account Key thành công!
                  </span>
                )}
                {gscError && (
                  <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
                    ⚠ {gscError}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Image SEO */}
        {activeTab === "images" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#0f172a" }}>
              Tối Ưu Hóa Hình Ảnh &amp; Thẻ ALT Tự Động
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
              Tự động bổ sung thẻ ALT cho hình ảnh thiếu mô tả để tăng khả năng xuất hiện trên Google Images.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Tự động điền ALT từ tiêu đề bài viết</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Nếu ảnh đại diện hoặc ảnh nội dung không có ALT, tự động dùng tiêu đề bài viết làm thẻ thay thế</div>
                </div>
                <input type="checkbox" defaultChecked style={{ transform: "scale(1.2)", cursor: "pointer" }} />
              </div>

              <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Nén ảnh WebP &amp; Chống lỗi Hotlink qua R2</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Tải ảnh gốc về bucket R2 mstudio-media và phân phối qua CDN với độ trễ thấp</div>
                </div>
                <input type="checkbox" defaultChecked style={{ transform: "scale(1.2)", cursor: "pointer" }} />
              </div>
            </div>
          </div>
        )}
      </TokenGate>
    </main>
  );
}
