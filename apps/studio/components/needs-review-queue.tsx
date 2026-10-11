"use client";

import { useEffect, useState } from "react";
import {
  TokenGate,
  TransitionPublishButtons,
} from "./cms-actions";
import {
  apiBaseUrl,
  formatTime,
  REVIEW_STATUSES,
  webBaseUrl,
  type ArticleRow,
} from "../lib/cms";
import type { ArticleStatus } from "../lib/cms";

interface QueueState {
  status: ArticleStatus;
  rows: ArticleRow[];
  error?: string;
}

async function fetchStatus(
  status: ArticleStatus,
  token: string,
): Promise<QueueState> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/articles?status=${status}&limit=50`,
      { headers: { authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!response.ok) {
      return { status, rows: [], error: `HTTP ${response.status}` };
    }
    const payload = (await response.json()) as { rows?: ArticleRow[] };
    return {
      status,
      rows: Array.isArray(payload.rows) ? payload.rows : [],
    };
  } catch {
    return { status, rows: [], error: "Không gọi được API" };
  }
}

function QueueTable({ queue }: { queue: QueueState }) {
  return (
    <section aria-labelledby={`queue-${queue.status}`} style={{ marginBottom: 24 }}>
      <h2 id={`queue-${queue.status}`} style={{ fontSize: "var(--text-xl)" }}>
        {queue.status} ({queue.rows.length})
      </h2>
      {queue.error ? (
        <p role="alert">Lỗi tải {queue.status}: {queue.error}</p>
      ) : queue.rows.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>Trống.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption style={{ textAlign: "left" }}>Bài chờ ở trạng thái {queue.status}</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left" }}>ID</th>
              <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
              <th scope="col" style={{ textAlign: "left" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {queue.rows.map((article) => (
              <tr key={article.id}>
                <td>
                  <a
                    href={`${webBaseUrl()}/bai-viet/${article.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {article.id.slice(0, 8)}…
                  </a>
                  <br />
                  <span style={{ color: "var(--gray)" }}>{article.storyId.slice(0, 8)}…</span>
                </td>
                <td>{formatTime(article.updatedAt)}</td>
                <td>
                  <TransitionPublishButtons
                    articleId={article.id}
                    status={article.status}
                    revisionId={article.currentRevisionId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function NeedsReviewQueue() {
  const [queues, setQueues] = useState<QueueState[] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    try {
      const token = window.localStorage.getItem("mstudio-cms-token") ?? "";
      if (!token) {
        setQueues(REVIEW_STATUSES.map((status) => ({ status, rows: [] })));
        return;
      }
      void Promise.all(REVIEW_STATUSES.map((status) => fetchStatus(status, token))).then(
        (results) => {
          if (!cancelled) setQueues(results);
        },
      );
    } catch {
      if (!cancelled) {
        setQueues(REVIEW_STATUSES.map((status) => ({ status, rows: [] })));
      }
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (!queues) {
    return <p role="status">Đang tải hàng đợi…</p>;
  }
  return (
    <TokenGate>
      {queues.map((queue) => (
        <QueueTable key={queue.status} queue={queue} />
      ))}
    </TokenGate>
  );
}
