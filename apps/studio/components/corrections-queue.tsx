"use client";

import { useEffect, useState } from "react";
import {
  fetchArticlesByStatuses,
  fetchArticlesByStatus,
  TokenGate,
  TransitionPublishButtons,
} from "./cms-actions";
import { formatTime, type ArticleRow } from "../lib/cms";

// TODO backend: chưa có bảng corrections/flags lẫn endpoint correction
// requests — danh sách yêu cầu sửa lỗi sẽ hiển thị tại đây khi API mở.
const CORRECTION_ARTICLE_STATUSES = ["corrected", "retracted"] as const;

interface CorrectionArticlesState {
  rows: ArticleRow[];
  error?: string;
}

export function CorrectionsQueue() {
  const [articles, setArticles] = useState<
    CorrectionArticlesState | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    let token = "";
    try {
      token = window.localStorage.getItem("mstudio-cms-token") ?? "";
    } catch {
      token = "";
    }
    void fetchArticlesByStatuses(CORRECTION_ARTICLE_STATUSES, token).then((page) => {
      if (cancelled) return;
      setArticles({
        rows: page.rows,
        error: page.error,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TokenGate>
      <section aria-labelledby="correction-requests" style={{ marginBottom: 24 }}>
        <h2 id="correction-requests" style={{ fontSize: "var(--text-xl)" }}>
          Yêu cầu sửa lỗi
        </h2>
        <p role="status" style={{ color: "var(--gray)" }}>
          Backend chưa có bảng corrections/flags và endpoint tương ứng —
          trang sẽ hiển thị danh sách yêu cầu sửa lỗi tại đây khi API sẵn
          sàng.
        </p>
      </section>

      <section aria-labelledby="correction-articles">
        <h2 id="correction-articles" style={{ fontSize: "var(--text-xl)" }}>
          Bài đã corrected / retracted
        </h2>
        {!articles ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Đang tải…
          </p>
        ) : articles.error ? (
          <p role="alert">Lỗi tải corrected/retracted: {articles.error}</p>
        ) : articles.rows.length === 0 ? (
          <p role="status" style={{ color: "var(--gray)" }}>
            Chưa có bài nào ở trạng thái corrected hoặc retracted.
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
                {articles.rows.length} bài sau khi sửa/lỗi nghiêm trọng
              </caption>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Bài viết / Story</th>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Trạng thái</th>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Cập nhật</th>
                  <th scope="col" style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {articles.rows.map((article) => (
                  <tr key={article.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                        Bài #{article.id.slice(0, 8)}…
                      </span>
                      <br />
                      <span style={{ color: "var(--gray)", fontSize: "12px" }}>
                        Chùm tin: {article.storyId.slice(0, 8)}…
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          background: article.status === "corrected" ? "#fef3c7" : "#fee2e2",
                          color: article.status === "corrected" ? "#b45309" : "#b91c1c",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontWeight: 600,
                        }}
                      >
                        ● {article.status}
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
      </section>
    </TokenGate>
  );
}
