"use client";

import { useEffect, useState } from "react";
import {
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
    void Promise.all(
      CORRECTION_ARTICLE_STATUSES.map((status) =>
        fetchArticlesByStatus(status, token),
      ),
    ).then((pages) => {
      if (cancelled) return;
      setArticles({
        rows: pages.flatMap((page) => page.rows),
        error: pages.find((page) => page.error)?.error,
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
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption style={{ textAlign: "left" }}>
              {articles.rows.length} bài sau khi sửa/lỗi nghiêm trọng
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: "left" }}>ID</th>
                <th scope="col" style={{ textAlign: "left" }}>Trạng thái</th>
                <th scope="col" style={{ textAlign: "left" }}>Cập nhật</th>
                <th scope="col" style={{ textAlign: "left" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.rows.map((article) => (
                <tr key={article.id}>
                  <td>
                    {article.id.slice(0, 8)}…
                    <br />
                    <span style={{ color: "var(--gray)" }}>
                      {article.storyId.slice(0, 8)}…
                    </span>
                  </td>
                  <td>{article.status}</td>
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
      </section>
    </TokenGate>
  );
}
