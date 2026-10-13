"use client";

import { useEffect, useState, useCallback } from "react";
import { authedFetch, useCmsToken } from "../../components/cms-actions";
import { apiBaseUrl } from "../../lib/cms";

type AgentRunStatus = "pending" | "running" | "succeeded" | "failed";

interface AgentRunRow {
  id: string;
  storyId?: string;
  type: string;
  promptVersion: string;
  model: string;
  status: AgentRunStatus;
  errorCode?: string;
  errorMessage?: string;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
}

const statusOrder: AgentRunStatus[] = ["running", "pending", "failed", "succeeded"];

export default function AiDeskPage() {
  const [runs, setRuns] = useState<AgentRunRow[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [token] = useCmsToken();

  const fetchRuns = useCallback(async () => {
    const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
    try {
      const res = await authedFetch(`${apiBaseUrl()}/agent-runs`, activeToken);
      if (res.ok) {
        const data = (await res.json()) as { runs?: AgentRunRow[] };
        if (Array.isArray(data.runs)) {
          setRuns(data.runs);
        }
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    void fetchRuns();
    const interval = setInterval(() => void fetchRuns(), 10000);
    return () => clearInterval(interval);
  }, [fetchRuns]);

  async function handleGenerate() {
    const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
    setIsGenerating(true);
    setNotice("Đang kích hoạt AI Writer pipeline...");
    try {
      const res = await authedFetch(`${apiBaseUrl()}/agent-runs/generate`, activeToken, { method: "POST" });
      if (res.ok) {
        setNotice("✓ Đã kích hoạt Agent Run thành công!");
      }
      await fetchRuns();
    } catch {
      setNotice("Lỗi kết nối tới AI API.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setNotice(null), 3500);
    }
  }

  const counts = new Map<AgentRunStatus, number>(
    statusOrder.map((status) => [status, runs.filter((run) => run.status === status).length]),
  );

  return (
    <main>
      <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 8px" }}>AI Desk</h1>
      <section aria-labelledby="agent-status-heading" style={{ marginBottom: 24 }}>
        <h2 id="agent-status-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Trạng thái agent
        </h2>
        <ul style={{ display: "flex", gap: 16, listStyle: "none", margin: 0, padding: 0 }}>
          {statusOrder.map((status) => (
            <li key={status} style={{ padding: "6px 12px", background: "var(--bg-subtle, #f1f5f9)", borderRadius: 6, fontWeight: 500 }}>
              {status}: <strong>{counts.get(status) ?? 0}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="generate-draft-heading" style={{ marginBottom: 24, padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <h2 id="generate-draft-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px", fontWeight: 600 }}>
          Tạo bản thảo tự động
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn-primary"
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              fontWeight: 600,
              cursor: isGenerating ? "not-allowed" : "pointer",
            }}
          >
            {isGenerating ? "⏳ Đang tạo..." : "⚡ Generate draft"}
          </button>
          {notice && <span style={{ color: "#16a34a", fontSize: 13, fontWeight: 600 }}>{notice}</span>}
        </div>
        <p style={{ color: "var(--gray)", fontSize: 13, margin: "8px 0 0" }}>
          Kích hoạt AI writer pipeline để tạo bản thảo cho các tin bài incoming từ RSS feeds.
        </p>
      </section>

      <section aria-labelledby="agent-history-heading" style={{ marginBottom: 24 }}>
        <h2 id="agent-history-heading" style={{ fontSize: "var(--text-base)", margin: "0 0 8px" }}>
          Lịch sử chạy gần đây ({runs.length})
        </h2>
        {runs.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)", margin: 0 }}>
            Chưa có agent run nào — bấm &quot;Generate draft&quot; để khởi chạy agent đầu tiên.
          </p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px" }}>Loại</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px" }}>Model</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px" }}>Thời gian</th>
                <th scope="col" style={{ textAlign: "left", padding: "8px 12px" }}>Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>{run.type}</td>
                  <td style={{ padding: "8px 12px" }}>{run.model}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: run.status === "succeeded" ? "#dcfce7" : run.status === "failed" ? "#fee2e2" : "#fef3c7",
                      color: run.status === "succeeded" ? "#166534" : run.status === "failed" ? "#991b1b" : "#92400e",
                    }}>
                      {run.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--gray)" }}>
                    {run.createdAt ? new Date(run.createdAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td style={{ padding: "8px 12px", color: "#dc2626" }}>
                    {run.status === "failed" ? (run.errorMessage || run.errorCode || "unknown") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
