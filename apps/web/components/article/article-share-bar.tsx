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
    <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 backdrop-blur-xl shadow-xl">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
        Tiện ích đọc tin
      </h3>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <span className="text-cyan-400 font-bold">{copied ? "✓" : "🔗"}</span>
          <span>{copied ? "Đã sao chép link" : "Sao chép link"}</span>
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer text-center"
        >
          Post X
        </a>
      </div>
    </div>
  );
}
