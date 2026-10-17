"use client";

import React from "react";
import { AmbientGlow } from "./ambient-glow";
import { GlassCard } from "./glass-card";

/**
 * 1. AIBenchmarkWidget - Dành cho chuyên mục Công nghệ / AI
 * Tuân thủ Setproduct Math: Router (24px/rounded-3xl) - P (16px/p-4) = Rinner (8px/rounded-lg)
 */
export interface BenchmarkItem {
  model: string;
  score: number;
  tokensPerSec: number;
  highlight?: boolean;
}

const DEFAULT_BENCHMARKS: BenchmarkItem[] = [
  { model: "Claude 3.7 Sonnet (Hybrid)", score: 94.2, tokensPerSec: 135, highlight: true },
  { model: "GPT-4.5 Ultra", score: 92.8, tokensPerSec: 92 },
  { model: "Gemini 2.5 Flash Thinking", score: 93.5, tokensPerSec: 185 },
];

export function AIBenchmarkWidget({
  title = "AI Intelligence Index 2026",
  items = DEFAULT_BENCHMARKS,
  className = "",
}: {
  title?: string;
  items?: BenchmarkItem[];
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-cyan-500/20 dark:bg-slate-950/70 ${className}`}>
      <AmbientGlow color="rgba(6, 182, 212, 0.15)" size={180} className="-top-12 -right-12" />
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">{title}</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">MMLU-Pro / Live</span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-2.5 transition-all ${
              item.highlight
                ? "bg-cyan-500/10 border border-cyan-500/30 text-white"
                : "bg-white/5 border border-white/5 text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium">{item.model}</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-cyan-300 font-bold">{item.score}%</span>
                <span className="text-[10px] text-slate-400">{item.tokensPerSec} t/s</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  item.highlight
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                    : "bg-slate-500"
                }`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. BentoMarketStrip - Dành cho chuyên mục Kinh doanh / Tài chính
 */
export interface MarketTicker {
  symbol: string;
  value: string;
  change: string;
  isPositive: boolean;
  history?: number[];
}

const DEFAULT_MARKETS: MarketTicker[] = [
  { symbol: "VN-INDEX", value: "1,342.80", change: "+1.24%", isPositive: true },
  { symbol: "S&P 500", value: "5,864.20", change: "+0.45%", isPositive: true },
  { symbol: "VÀNG SJC", value: "86.5 tr", change: "-0.23%", isPositive: false },
  { symbol: "USD/VND", value: "25,410", change: "+0.08%", isPositive: true },
];

export function BentoMarketStrip({
  tickers = DEFAULT_MARKETS,
  className = "",
}: {
  tickers?: MarketTicker[];
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto no-scrollbar rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-emerald-500/20 dark:bg-slate-950/70 ${className}`}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Thị trường 24/7</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Độ trễ &lt; 5s</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {tickers.map((t, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-white/5 bg-white/5 p-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold">{t.symbol}</span>
              <span
                className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded ${
                  t.isPositive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {t.change}
              </span>
            </div>
            <div className="mt-1 font-mono text-sm font-bold text-white tracking-tight">
              {t.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. CrisisTimeline - Dành cho Thời sự & Thế giới
 */
export interface TimelineEvent {
  time: string;
  title: string;
  urgency?: "critical" | "high" | "normal";
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  { time: "10:30", title: "Hội nghị thượng đỉnh G7 công bố sáng kiến AI an toàn toàn cầu", urgency: "critical" },
  { time: "09:15", title: "Châu Âu thông qua gói ngân sách chuyển đổi năng lượng sạch 2026", urgency: "high" },
  { time: "07:45", title: "Thị trường hàng hóa Á-Âu phản ứng tích cực với thỏa thuận vận tải mới", urgency: "normal" },
];

export function CrisisTimeline({
  title = "Diễn biến nóng 24h",
  events = DEFAULT_EVENTS,
  className = "",
}: {
  title?: string;
  events?: TimelineEvent[];
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-amber-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-amber-500/20 dark:bg-slate-950/70 ${className}`}>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <h3 className="text-xs font-semibold tracking-wider text-amber-400 uppercase">{title}</h3>
        </div>
        <span className="text-[10px] text-amber-300/80 font-mono">Live Briefing</span>
      </div>

      <div className="relative pl-3 space-y-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
        {events.map((ev, idx) => (
          <div key={idx} className="relative group">
            <span
              className={`absolute -left-[11px] top-1 h-2 w-2 rounded-full border-2 border-slate-900 ${
                ev.urgency === "critical"
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  : ev.urgency === "high"
                  ? "bg-amber-400"
                  : "bg-slate-400"
              }`}
            />
            <div className="rounded-lg bg-white/5 border border-white/5 p-2 hover:bg-white/10 transition-colors">
              <span className="font-mono text-[10px] text-amber-300/90 font-semibold">{ev.time}</span>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">{ev.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. ScienceDataBox - Dành cho Khoa học
 */
export function ScienceDataBox({
  label = "Đột phá Lượng tử 2026",
  metric = "1,000,000",
  unit = "Qubits logic",
  description = "Kiến trúc bẫy ion thế hệ mới đạt ngưỡng chịu lỗi thực nghiệm.",
  className = "",
}: {
  label?: string;
  metric?: string;
  unit?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-950/70 ${className}`}>
      <AmbientGlow color="rgba(99, 102, 241, 0.2)" size={160} className="-bottom-8 -right-8" />
      <div className="flex items-center gap-2 pb-2">
        <span className="flex h-2 w-2 rounded-full bg-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{label}</span>
      </div>
      <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 mt-1">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-2xl font-black text-indigo-200">{metric}</span>
          <span className="text-xs text-indigo-400 font-semibold">{unit}</span>
        </div>
        <p className="mt-1 text-xs text-slate-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/**
 * 5. EVParamWidget - Dành cho Xe & Di chuyển tương lai
 */
export function EVParamWidget({
  modelName = "Hyper-EV GT 2026",
  accel = "1.89s",
  range = "820km",
  charging = "800V / 10-80% 12m",
  className = "",
}: {
  modelName?: string;
  accel?: string;
  range?: string;
  charging?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-red-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-red-500/20 dark:bg-slate-950/70 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">{modelName}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Spec Matrix</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2.5">
        <div className="rounded-lg bg-white/5 border border-white/5 p-2 text-center">
          <div className="text-[10px] text-slate-400">0-100 km/h</div>
          <div className="font-mono text-sm font-bold text-red-300 mt-0.5">{accel}</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-2 text-center">
          <div className="text-[10px] text-slate-400">Tầm hoạt động</div>
          <div className="font-mono text-sm font-bold text-white mt-0.5">{range}</div>
        </div>
        <div className="rounded-lg bg-white/5 border border-white/5 p-2 text-center">
          <div className="text-[10px] text-slate-400">Sạc nhanh</div>
          <div className="font-mono text-xs font-bold text-emerald-300 mt-0.5">{charging}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. HealthAirQualityWidget - Dành cho Đời sống / Sức khỏe
 */
export function HealthAirQualityWidget({
  location = "Hà Nội - Hoàn Kiếm",
  aqi = 42,
  status = "Không khí Tốt",
  uv = "3 (Trung bình)",
  className = "",
}: {
  location?: string;
  aqi?: number;
  status?: string;
  uv?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-teal-500/20 bg-slate-900/60 p-4 shadow-xl backdrop-blur-xl dark:border-teal-500/20 dark:bg-slate-950/70 ${className}`}>
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-teal-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Môi trường sống</span>
        </div>
        <span className="text-[10px] text-slate-400">{location}</span>
      </div>

      <div className="rounded-lg bg-teal-500/10 border border-teal-500/20 p-2.5 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-teal-300">{aqi}</span>
            <span className="text-xs text-teal-400 font-semibold">AQI</span>
          </div>
          <p className="text-[11px] text-slate-300">{status}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400">Chỉ số UV</span>
          <p className="text-xs font-mono font-bold text-amber-300">{uv}</p>
        </div>
      </div>
    </div>
  );
}
