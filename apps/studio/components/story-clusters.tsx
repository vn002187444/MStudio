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
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption style={{ textAlign: "left" }}>
            {clusters.length} story cluster (nhóm bài theo storyId)
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left" }}>
                Story
              </th>
              <th scope="col" style={{ textAlign: "left" }}>
                Tiêu đề mới nhất
              </th>
              <th scope="col" style={{ textAlign: "left" }}>Số bài</th>
              <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
              <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {clusters.map((cluster) => (
              <tr key={cluster.storyId}>
                <td>{cluster.storyId.slice(0, 8)}…</td>
                <td>
                  {cluster.latestTitle ?? (
                    <span style={{ color: "var(--gray)" }}>chưa có title</span>
                  )}
                </td>
                <td>
                  {cluster.articleCount}
                  {cluster.articleCount > 1
                    ? ` (${cluster.articleCount - 1} bài con)`
                    : ""}
                </td>
                <td>{cluster.statuses.join(", ")}</td>
                <td>{formatTime(cluster.latestUpdatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TokenGate>
  );
}
