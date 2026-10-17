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
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
        Tiện ích đọc tin
      </h3>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{copied ? "✓" : "🔗"}</span>
          <span>{copied ? "Đã sao chép" : "Sao chép link"}</span>
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors"
        >
          Post X
        </a>
      </div>
    </div>
  );
}
