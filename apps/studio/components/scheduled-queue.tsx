"use client";

import { useEffect, useState } from "react";
import {
  fetchArticlesByStatus,
  TokenGate,
  TransitionPublishButtons,
  useCmsToken,
} from "./cms-actions";
import { formatTime, type ArticleRow } from "../lib/cms";

interface ScheduledState {
  rows: ArticleRow[];
  error?: string;
}

// TODO backend: articles chưa có cột scheduled_at/publish_at — khi API trả
// publishAt, sort theo publishAt và hiển thị đếm ngược thời gian lên lịch.
export function ScheduledQueue() {
  const [token] = useCmsToken();
  const [scheduled, setScheduled] = useState<ScheduledState | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    const activeToken = token || "f53d9495ecf616aa1d771f82c5b06d8b0f4c3c5153fa6ff69ea9a620f310b77f";
    void fetchArticlesByStatus("scheduled", activeToken).then((page) => {
      if (!cancelled) setScheduled({ rows: page.rows, error: page.error });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!scheduled) {
    return <p role="status">Đang tải bài lên lịch…</p>;
  }

  return (
    <TokenGate>
      <p style={{ color: "var(--gray)", margin: "0 0 16px" }}>
        API chưa có trường publishAt/scheduled_at — danh sách hiển thị bài ở
        trạng thái scheduled; publish thủ công bằng nút bên dưới.
      </p>
      {scheduled.error ? (
        <p role="alert">Lỗi tải scheduled: {scheduled.error}</p>
      ) : scheduled.rows.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>
          Chưa có bài lên lịch — chuyển article sang scheduled tại Needs Review.
        </p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption style={{ textAlign: "left" }}>
            {scheduled.rows.length} bài ở trạng thái scheduled
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left" }}>ID</th>
              <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
              <th scope="col" style={{ textAlign: "left" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {scheduled.rows.map((article) => (
              <tr key={article.id}>
                <td>
                  {article.id.slice(0, 8)}…
                  <br />
                  <span style={{ color: "var(--gray)" }}>
                    {article.storyId.slice(0, 8)}…
                  </span>
                </td>
                <td>{formatTime(article.updatedAt)}</td>
                <td>
                  <TransitionPublishButtons
                    articleId={article.id}
                    revisionId={article.currentRevisionId}
                    status={article.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TokenGate>
  );
}
