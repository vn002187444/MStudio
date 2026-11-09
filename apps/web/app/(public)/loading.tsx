"use client";

import React, { useState, useEffect } from "react";

/**
 * Global Loading State cho MStudio Public Routes
 * Đáp ứng yêu cầu: Bổ sung thêm nút Reload / Tải lại trang trong lúc chờ dữ liệu
 */
export default function PublicLoading() {
  const [secondsWaiting, setSecondsWaiting] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsWaiting((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main
      aria-busy="true"
      aria-label="Đang nạp dữ liệu MStudio Channel"
      className="home-main min-h-screen bg-[#07080B] text-slate-100 overflow-hidden"
    >
      {/* Top Waiting & Fast Reload Bar */}
      <div className="w-full bg-slate-900/90 border-b border-cyan-500/20 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
        <div className="container-content max-w-[var(--container)] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" aria-hidden="true" />
            <span className="text-xs font-mono font-medium text-slate-300">
              Đang kết nối luồng dữ liệu thời gian thực… {secondsWaiting > 0 && `(${secondsWaiting}s)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Tải lại trang ngay lập tức"
            >
              <span aria-hidden="true">↻</span>
              <span>Tải lại</span>
            </button>
            <a
              href="/dang-nong"
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors hidden sm:inline-block px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
            >
              Xem tin nóng <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bento Grid Skeleton */}
      <div className="container-content max-w-[var(--container)] mx-auto px-4 pt-8 pb-20 space-y-8">
        {/* Hero Banner Skeleton */}
        <div className="w-full h-64 md:h-80 rounded-3xl bg-slate-900/80 border border-white/10 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>

        {/* 3-Column Bento Grid Skeleton */}
        <div className="bento-grid-363">
          <div className="bento-col-3 h-96 rounded-3xl bg-slate-900/70 border border-white/5 animate-pulse p-4 space-y-4">
            <div className="h-6 w-32 bg-slate-800 rounded-md" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
          </div>

          <div className="bento-col-6 h-96 rounded-3xl bg-slate-900/70 border border-white/5 animate-pulse p-6 space-y-4">
            <div className="h-48 bg-slate-800/80 rounded-2xl" />
            <div className="h-8 w-3/4 bg-slate-800 rounded-lg" />
            <div className="h-4 w-1/2 bg-slate-800/60 rounded" />
          </div>

          <div className="bento-col-3 h-96 rounded-3xl bg-slate-900/70 border border-white/5 animate-pulse p-4 space-y-4">
            <div className="h-6 w-32 bg-slate-800 rounded-md" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
            <div className="h-16 bg-slate-800/80 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
