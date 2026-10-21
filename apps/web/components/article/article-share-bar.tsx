"use client";

import React, { useState } from "react";

export function ArticleShareBar({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/90 [html.light_&]:bg-white/95 [html.light_&]:border-slate-200/80 [html.light_&]:shadow-lg p-5 backdrop-blur-xl shadow-xl">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 [html.light_&]:text-slate-700 mb-3">
        Tiện ích đọc tin
      </h3>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white [html.light_&]:bg-slate-100 [html.light_&]:hover:bg-slate-200 [html.light_&]:border-slate-300 [html.light_&]:text-slate-800 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <span aria-hidden="true" className="text-cyan-400 [html.light_&]:text-blue-600 font-bold">{copied ? "✓" : "🔗"}</span>
          <span>{copied ? "Đã sao chép đường dẫn" : "Sao chép đường dẫn bài viết"}</span>
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chia sẻ bài viết lên X (Twitter)"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white [html.light_&]:bg-slate-100 [html.light_&]:hover:bg-slate-200 [html.light_&]:border-slate-300 [html.light_&]:text-slate-800 transition-all shadow-md active:scale-95 cursor-pointer text-center"
        >
          Post X
        </a>
      </div>
    </div>
  );
}
