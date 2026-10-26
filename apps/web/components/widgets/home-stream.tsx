"use client";

import React, { useState } from "react";
import type { PublishedArticleRecord } from "../../lib/contracts";
import { CompactNewsCard } from "../article/news-card";

interface HomeStreamClientProps {
  initialArticles: PublishedArticleRecord[];
  initialCursor?: { createdAt: string; id: string };
}

export function HomeStreamClient({ initialArticles, initialCursor }: HomeStreamClientProps) {
  const [articles, setArticles] = useState<PublishedArticleRecord[]>(initialArticles);
  const [cursor, setCursor] = useState<{ createdAt: string; id: string } | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(Boolean(initialCursor) || initialArticles.length >= 10);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const lastArticle = articles[articles.length - 1];
      const cursorParams = cursor
        ? `&cursorCreatedAt=${encodeURIComponent(cursor.createdAt)}&cursorId=${encodeURIComponent(cursor.id)}`
        : lastArticle
        ? `&cursorCreatedAt=${encodeURIComponent(lastArticle.updatedAt)}&cursorId=${encodeURIComponent(lastArticle.id)}`
        : "";

      const res = await fetch(`/api/articles-stream?limit=12${cursorParams}`);
      if (!res.ok) {
        setHasMore(false);
        return;
      }

      const data = await res.json();
      const newRows: PublishedArticleRecord[] = Array.isArray(data.rows) ? data.rows : [];

      if (newRows.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...newRows]);
        setCursor(data.nextCursor);
        if (newRows.length < 12) {
          setHasMore(false);
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {articles.length > 0 ? (
        <div className="divide-y divide-white/10">
          {articles.map((article) => (
            <CompactNewsCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-slate-400 py-8 text-center text-sm">
          Đang cập nhật các bài viết mới…
        </p>
      )}

      {hasMore && (
        <div className="pt-6 border-t border-white/10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            aria-busy={loading}
            className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:via-cyan-400 hover:to-teal-400 active:scale-95 transition-all shadow-xl shadow-cyan-500/20 border border-cyan-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <span aria-hidden="true" className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Đang tải thêm bài viết…</span>
              </>
            ) : (
              <>
                <span>Xem thêm dòng tin thời sự</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">↓</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
