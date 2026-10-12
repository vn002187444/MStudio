"use client";

import { useEffect, useState } from "react";
import {
  fetchArticlesByStatus,
  TokenGate,
  TransitionPublishButtons,
} from "./cms-actions";
import { formatTime, type ArticleRow } from "../lib/cms";

interface DraftsState {
  rows: ArticleRow[];
  error?: string;
}

export function DraftsQueue() {
  const [drafts, setDrafts] = useState<DraftsState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let token = "";
    try {
      token = window.localStorage.getItem("mstudio-cms-token") ?? "";
    } catch {
      token = "";
    }
    void fetchArticlesByStatus("drafted", token).then((page) => {
      if (!cancelled) setDrafts({ rows: page.rows, error: page.error });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!drafts) {
    return <p role="status">Đang tải bản nháp…</p>;
  }

  return (
    <TokenGate>
      {drafts.error ? (
        <p role="alert">Lỗi tải drafts: {drafts.error}</p>
      ) : drafts.rows.length === 0 ? (
        <p role="status" style={{ color: "var(--gray)" }}>
          Chưa có bản nháp nào — duyệt tin ở Incoming để tạo article mới.
        </p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <caption style={{ textAlign: "left" }}>
            {drafts.rows.length} bản nháp (status=drafted)
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left" }}>ID</th>
              <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
              <th scope="col" style={{ textAlign: "left" }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {drafts.rows.map((article) => (
              <tr key={article.id}>
                <td>
                  {/* TODO: mở /editor/[id] thật khi editor nhận article id — hiện editor chỉ là canvas local. */}
                  <a href={`/editor?article=${article.id}`}>
                    {article.id.slice(0, 8)}…
                  </a>
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
