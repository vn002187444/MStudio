"use client";

import React, { useEffect } from "react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MStudio Public Error Boundary]", error);
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main
      className="home-main min-h-screen bg-[#07080B] text-slate-100 flex items-center justify-center p-6"
      id="main-content"
    >
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl p-8 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-5">
          <span className="text-2xl animate-spin">⟳</span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Đang nạp dữ liệu MStudio</h1>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Hệ thống đang đồng bộ kết nối luồng dữ liệu thời gian thực. Bạn có thể nhấn nút bên dưới để tải lại ngay lập tức.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95"
          >
            <span>Tải lại trang</span>
            <span>↻</span>
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <span>Thử lại</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-2 text-xs">
          <a href="/dang-nong" className="text-slate-400 hover:text-cyan-400">#ĐangNóng</a>
          <span className="text-slate-600">•</span>
          <a href="/cong-nghe" className="text-slate-400 hover:text-cyan-400">#CôngNghệ</a>
          <span className="text-slate-600">•</span>
          <a href="/ai-channel" className="text-slate-400 hover:text-cyan-400">#AIChannel</a>
          <span className="text-slate-600">•</span>
          <a href="/kinh-doanh" className="text-slate-400 hover:text-cyan-400">#KinhDoanh</a>
        </div>
      </div>
    </main>
  );
}
