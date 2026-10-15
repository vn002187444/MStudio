"use client";

import { useEffect, useState } from "react";
import { TokenGate } from "./cms-actions";
import {
  apiBaseUrl,
  formatTime,
  type ArticleStatus,
} from "../lib/cms";

interface StoryClusterRow {
  storyId: string;
  articleCount: number;
  statuses: ArticleStatus[];
  latestTitle?: string;
  latestUpdatedAt: string;
}

async function fetchStoryClusters(): Promise<{
  rows: StoryClusterRow[];
  error?: string;
}> {
  try {
    const response = await fetch(`${apiBaseUrl()}/stories`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { rows: [], error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as {
      rows?: StoryClusterRow[];
    };
    return { rows: Array.isArray(payload.rows) ? payload.rows : [] };
  } catch {
    return { rows: [], error: "Không gọi được API" };
  }
}

export function StoryClusters() {
  const [clusters, setClusters] = useState<StoryClusterRow[] | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchStoryClusters().then((result) => {
      if (cancelled) return;
      setError(result.error);
      setClusters(result.rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!clusters) {
    return <p role="status">Đang tải story clusters…</p>;
  }

  return (
    <TokenGate>
      {error ? <p role="alert">Lỗi tải clusters: {error}</p> : null}
      {clusters.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>
          Chưa có cluster nào — duyệt tin ở Incoming để tạo story/article.
        </p>
      ) : (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginTop: 16,
          }}
        >
          <table className="responsive-table" style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "var(--gray)", fontSize: "13px" }}>
              {clusters.length} story cluster (nhóm bài theo storyId)
            </caption>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>
                  Chùm tin (Story ID)
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>
                  Tiêu đề chùm tin mới nhất
                </th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Số bài</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((cluster) => (
                <tr key={cluster.storyId} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)", fontFamily: "monospace" }}>
                      #{cluster.storyId.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: 360 }}>
                    <span style={{ fontWeight: cluster.latestTitle ? 600 : 400, color: cluster.latestTitle ? "var(--ink)" : "var(--gray)" }}>
                      {cluster.latestTitle ?? "Chưa có tiêu đề"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {cluster.articleCount} bài
                      {cluster.articleCount > 1 ? ` (+${cluster.articleCount - 1} con)` : ""}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      {cluster.statuses.join(", ")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--gray)" }}>
                    {formatTime(cluster.latestUpdatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </TokenGate>
  );
}
