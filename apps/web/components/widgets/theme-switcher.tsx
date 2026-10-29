"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "dark" | "light" | "auto";

export function ThemeSwitcher({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("auto");
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((targetMode: ThemeMode) => {
    let resolvedTheme: "dark" | "light" = "dark";

    if (targetMode === "auto") {
      const hour = new Date().getHours();
      // Chu kỳ mặt trời: 6:00 - 18:00 là Sáng (Solar), 18:00 - 6:00 là Tối (Obsidian)
      const isDayTime = hour >= 6 && hour < 18;
      resolvedTheme = isDayTime ? "light" : "dark";
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
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("mstudio-theme-mode") as ThemeMode | null;
    const initialMode: ThemeMode = saved === "dark" || saved === "light" || saved === "auto" ? saved : "auto";
    setMode(initialMode);
    applyTheme(initialMode);

    // Chu kỳ kiểm tra 60s để tự động cập nhật khi qua ngưỡng 6h / 18h
    const timer = setInterval(() => {
      const currentSaved = localStorage.getItem("mstudio-theme-mode") as ThemeMode | null;
      if (!currentSaved || currentSaved === "auto") {
        applyTheme("auto");
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [applyTheme]);

  const handleChange = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("mstudio-theme-mode", newMode);
    applyTheme(newMode);
  };

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={`theme-switcher-pill inline-flex items-center justify-center h-[32px] w-[190px] sm:w-[210px] rounded-full bg-slate-900/40 border border-white/10 backdrop-blur-md ${className}`}
      >
        <span className="text-[11px] text-slate-400 font-medium animate-pulse">⚡ Đang tải...</span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tùy chọn giao diện hiển thị"
      className={`theme-switcher-pill relative inline-flex items-center gap-0.5 rounded-full bg-slate-900/80 border border-white/15 p-1 text-[11px] font-medium backdrop-blur-xl shadow-lg transition-all duration-200 transform-gpu ${className}`}
    >
      <button
        type="button"
        title="Giao diện Tối Obsidian (Dark Glassmorphism)"
        aria-label="Giao diện Tối Obsidian"
        aria-pressed={mode === "dark"}
        onClick={() => handleChange("dark")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 active:scale-95 ${
          mode === "dark"
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-[0_0_14px_rgba(37,99,235,0.6)]"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <span aria-hidden="true">🌙</span>
        <span className="hidden sm:inline">Tối</span>
      </button>

      <button
        type="button"
        title="Giao diện Sáng Solar (Solar Frosted, chống chói)"
        aria-label="Giao diện Sáng Solar"
        aria-pressed={mode === "light"}
        onClick={() => handleChange("light")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 active:scale-95 ${
          mode === "light"
            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-[0_0_14px_rgba(245,158,11,0.6)]"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <span aria-hidden="true">☀️</span>
        <span className="hidden sm:inline">Sáng</span>
      </button>

      <button
        type="button"
        title="Tự động theo giờ thực tế (6h-18h Sáng / 18h-6h Tối)"
        aria-label="Tự động theo giờ thực tế"
        aria-pressed={mode === "auto"}
        onClick={() => handleChange("auto")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 active:scale-95 ${
          mode === "auto"
            ? "bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <span aria-hidden="true">⚡</span>
        <span className="hidden sm:inline">Tự động</span>
      </button>
    </div>
  );
}
