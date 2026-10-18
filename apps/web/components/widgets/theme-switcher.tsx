"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "auto";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("mstudio-theme-mode") as ThemeMode | null;
    const initialMode: ThemeMode = saved === "dark" || saved === "light" || saved === "auto" ? saved : "auto";
    setMode(initialMode);
    applyTheme(initialMode);
  }, []);

  const applyTheme = (targetMode: ThemeMode) => {
    let resolvedTheme: "dark" | "light" = "dark";

    if (targetMode === "auto") {
      // Logic tự động: Kiểm tra prefers-color-scheme, hoặc theo thời gian thực (6:00 - 18:00 là sáng, sau 18:00 là tối)
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      // Ưu tiên theo chu kỳ mặt trời / thời gian thực, fallback hệ điều hành
      resolvedTheme = isNight ? "dark" : prefersDark ? "dark" : "light";
    } else {
      resolvedTheme = targetMode;
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    if (resolvedTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  };

  const handleChange = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("mstudio-theme-mode", newMode);
    applyTheme(newMode);
  };

  if (!mounted) {
    return (
      <div className={`flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5 text-[11px] ${className}`}>
        <span className="px-2 py-0.5 rounded-full text-slate-400">⚡ Auto</span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tùy chọn giao diện"
      className={`inline-flex items-center gap-0.5 rounded-full bg-slate-900/90 border border-white/15 p-0.5 text-[11px] font-medium backdrop-blur-md shadow-inner ${className}`}
    >
      <button
        type="button"
        title="Giao diện Tối (Dark Glassmorphism)"
        onClick={() => handleChange("dark")}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
          mode === "dark"
            ? "bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/50"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <span>🌙</span>
        <span className="hidden sm:inline">Tối</span>
      </button>

      <button
        type="button"
        title="Giao diện Sáng (Solar Frosted)"
        onClick={() => handleChange("light")}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
          mode === "light"
            ? "bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/50"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <span>☀️</span>
        <span className="hidden sm:inline">Sáng</span>
      </button>

      <button
        type="button"
        title="Tự động đổi theo giờ & hệ thống (Ngày Sáng / Đêm Tối)"
        onClick={() => handleChange("auto")}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all ${
          mode === "auto"
            ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/20"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <span>⚡</span>
        <span className="hidden sm:inline">Tự động</span>
      </button>
    </div>
  );
}
