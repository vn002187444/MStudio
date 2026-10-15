"use client";

import { useEffect, useState } from "react";
import {
  fetchArticlesByStatus,
  TokenGate,
  TransitionPublishButtons,
  useCmsToken,
} from "./cms-actions";
import { formatTime, type ArticleRow } from "../lib/cms";

interface DraftsState {
  rows: ArticleRow[];
  error?: string;
}

export function DraftsQueue() {
  const [token] = useCmsToken();
  const [drafts, setDrafts] = useState<DraftsState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void fetchArticlesByStatus("drafted", token).then((page) => {
      if (!cancelled) setDrafts({ rows: page.rows, error: page.error });
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

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
              {drafts.rows.length} bản nháp (status=drafted)
            </caption>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Bài viết / Story</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Cập nhật</th>
                <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {drafts.rows.map((article) => (
                <tr key={article.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <a
                      href={`/editor?article=${article.id}`}
                      style={{ fontWeight: 600, color: "var(--ink)", textDecoration: "none" }}
                    >
                      Bài #{article.id.slice(0, 8)}…
                    </a>
                    <br />
                    <span style={{ color: "var(--gray)", fontSize: "12px" }}>
                      Chùm tin: {article.storyId.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--gray)" }}>
                    {formatTime(article.updatedAt)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
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
        </div>
      )}
    </TokenGate>
  );
}
