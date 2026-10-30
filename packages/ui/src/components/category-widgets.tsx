"use client";

import React from "react";
import { AmbientGlow } from "./ambient-glow";

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
  const [benchmarks, setBenchmarks] = React.useState<BenchmarkItem[]>(items);
  const [sourceLabel, setSourceLabel] = React.useState<string>("MMLU-Pro / Live");

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/ai-benchmark")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.benchmarks?.length) {
          setBenchmarks(data.benchmarks);
          if (data.source) setSourceLabel(data.source);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-cyan-200/80 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <AmbientGlow color="rgba(6, 182, 212, 0.18)" size={180} className="-top-12 -right-12" />
      <div className="flex items-center justify-between pb-3 border-b border-white/10 [html.light_&]:border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"  aria-hidden="true" />
          <h3 className="text-xs font-bold tracking-wider text-cyan-300 [html.light_&]:text-cyan-700 uppercase">
            {title}
          </h3>
        </div>
        <span className="text-[10px] text-slate-300 [html.light_&]:text-slate-600 font-mono font-medium truncate max-w-[130px]">
          {sourceLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        {benchmarks.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-3 transition-all ${
              item.highlight
                ? "bg-cyan-950/70 border border-cyan-500/50 [html.light_&]:bg-cyan-50/90 [html.light_&]:border-cyan-300 text-white [html.light_&]:text-cyan-950 shadow-lg shadow-cyan-950/50"
                : "bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50/90 [html.light_&]:border-slate-200/80 text-slate-100 [html.light_&]:text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-white [html.light_&]:text-slate-900">
                {item.model}
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-cyan-300 [html.light_&]:text-cyan-700 font-bold text-sm">
                  {item.score}%
                </span>
                <span className="text-[10px] text-slate-300 [html.light_&]:text-slate-600 font-medium">
                  {item.tokensPerSec} t/s
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950 [html.light_&]:bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  item.highlight
                    ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                    : "bg-slate-500 [html.light_&]:bg-slate-400"
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

export interface MarketTicker {
  symbol: string;
  name?: string;
  value: string;
  change: string;
  isPositive: boolean;
}

/* ── 1. VN30 (30 Cổ phiếu Trụ Việt Nam) ── */
export const VN30_TICKERS: MarketTicker[] = [
  { symbol: "VCB", name: "Vietcombank", value: "94.500₫", change: "+1.18%", isPositive: true },
  { symbol: "FPT", name: "FPT Corp", value: "142.800₫", change: "+2.51%", isPositive: true },
  { symbol: "HPG", name: "Hòa Phát", value: "29.350₫", change: "+1.21%", isPositive: true },
  { symbol: "VHM", name: "Vinhomes", value: "43.600₫", change: "-0.68%", isPositive: false },
  { symbol: "VIC", name: "Vingroup", value: "44.200₫", change: "+0.45%", isPositive: true },
  { symbol: "TCB", name: "Techcombank", value: "24.850₫", change: "+1.64%", isPositive: true },
  { symbol: "MBB", name: "MBBank", value: "25.100₫", change: "+0.80%", isPositive: true },
  { symbol: "MWG", name: "Thế Giới Di Động", value: "68.200₫", change: "+1.79%", isPositive: true },
  { symbol: "SSI", name: "Chứng khoán SSI", value: "32.500₫", change: "+1.88%", isPositive: true },
  { symbol: "MSN", name: "Masan Group", value: "76.400₫", change: "-0.52%", isPositive: false },
  { symbol: "VNM", name: "Vinamilk", value: "67.800₫", change: "+0.30%", isPositive: true },
  { symbol: "ACB", name: "Á Châu", value: "25.600₫", change: "+0.79%", isPositive: true },
  { symbol: "CTG", name: "VietinBank", value: "36.900₫", change: "+1.37%", isPositive: true },
  { symbol: "VPB", name: "VPBank", value: "19.850₫", change: "+0.76%", isPositive: true },
  { symbol: "STB", name: "Sacombank", value: "33.700₫", change: "+2.12%", isPositive: true },
  { symbol: "BID", name: "BIDV", value: "50.200₫", change: "+0.60%", isPositive: true },
  { symbol: "GAS", name: "PV Gas", value: "72.100₫", change: "-0.41%", isPositive: false },
  { symbol: "VRE", name: "Vincom Retail", value: "19.200₫", change: "-0.52%", isPositive: false },
  { symbol: "TPB", name: "TPBank", value: "17.650₫", change: "+1.15%", isPositive: true },
  { symbol: "HDB", name: "HDBank", value: "27.400₫", change: "+1.48%", isPositive: true },
  { symbol: "SHB", name: "SHB Bank", value: "11.200₫", change: "+0.90%", isPositive: true },
  { symbol: "VIB", name: "VIB Bank", value: "22.300₫", change: "+0.68%", isPositive: true },
  { symbol: "LPB", name: "LPBank", value: "32.800₫", change: "+2.82%", isPositive: true },
  { symbol: "BCM", name: "Becamex IDC", value: "68.500₫", change: "-0.29%", isPositive: false },
  { symbol: "GVR", name: "Tập đoàn Cao su", value: "34.600₫", change: "+1.47%", isPositive: true },
  { symbol: "PLX", name: "Petrolimex", value: "41.300₫", change: "+0.49%", isPositive: true },
  { symbol: "POW", name: "PV Power", value: "12.850₫", change: "+0.39%", isPositive: true },
  { symbol: "SAB", name: "Sabeco", value: "56.400₫", change: "-0.35%", isPositive: false },
  { symbol: "VJC", name: "Vietjet Air", value: "104.500₫", change: "+0.48%", isPositive: true },
  { symbol: "SSB", name: "SeABank", value: "18.300₫", change: "+0.55%", isPositive: true },
];

/* ── 2. Global 30 (Chỉ số Thế giới, Vàng, Tiền tệ & Mega-caps) ── */
export const GLOBAL30_TICKERS: MarketTicker[] = [
  { symbol: "S&P 500", name: "US Large Cap", value: "5,864.20", change: "+0.45%", isPositive: true },
  { symbol: "NASDAQ", name: "US Tech 100", value: "18,375.40", change: "+0.62%", isPositive: true },
  { symbol: "DOW JONES", name: "US Industrial", value: "43,275.90", change: "+0.09%", isPositive: true },
  { symbol: "NIKKEI 225", name: "Japan", value: "39,120.50", change: "+0.78%", isPositive: true },
  { symbol: "HANG SENG", name: "Hong Kong", value: "20,804.10", change: "+3.61%", isPositive: true },
  { symbol: "DAX 40", name: "Germany", value: "19,657.40", change: "+0.38%", isPositive: true },
  { symbol: "FTSE 100", name: "UK", value: "8,358.20", change: "-0.32%", isPositive: false },
  { symbol: "KOSPI", name: "South Korea", value: "2,596.80", change: "-0.59%", isPositive: false },
  { symbol: "SHANGHAI", name: "China", value: "3,261.50", change: "+2.91%", isPositive: true },
  { symbol: "VÀNG SJC", name: "SJC Gold 1L", value: "86.50 tr", change: "-0.23%", isPositive: false },
  { symbol: "XAU/USD", name: "Gold Spot", value: "$2,721.40", change: "+1.08%", isPositive: true },
  { symbol: "BRENT OIL", name: "Crude Oil", value: "$74.29", change: "-1.39%", isPositive: false },
  { symbol: "USD/VND", name: "Tỷ giá liên ngân hàng", value: "25,410₫", change: "+0.08%", isPositive: true },
  { symbol: "EUR/USD", name: "Euro Dollar", value: "1.0865", change: "-0.12%", isPositive: false },
  { symbol: "NVDA", name: "NVIDIA Corp", value: "$138.00", change: "+0.78%", isPositive: true },
  { symbol: "AAPL", name: "Apple Inc", value: "$235.00", change: "+1.23%", isPositive: true },
  { symbol: "MSFT", name: "Microsoft", value: "$418.16", change: "+0.35%", isPositive: true },
  { symbol: "GOOGL", name: "Alphabet", value: "$166.57", change: "+1.53%", isPositive: true },
  { symbol: "AMZN", name: "Amazon", value: "$187.53", change: "+0.79%", isPositive: true },
  { symbol: "META", name: "Meta Platforms", value: "$576.47", change: "+0.85%", isPositive: true },
  { symbol: "TSM", name: "TSMC", value: "$205.84", change: "+9.79%", isPositive: true },
  { symbol: "AVGO", name: "Broadcom", value: "$181.25", change: "+1.40%", isPositive: true },
  { symbol: "TSLA", name: "Tesla Inc", value: "$220.70", change: "-0.09%", isPositive: false },
  { symbol: "ASML", name: "ASML Holding", value: "$738.90", change: "-1.12%", isPositive: false },
  { symbol: "BABA", name: "Alibaba", value: "$100.80", change: "+2.40%", isPositive: true },
  { symbol: "LLY", name: "Eli Lilly", value: "$915.20", change: "+0.65%", isPositive: true },
  { symbol: "WMT", name: "Walmart", value: "$80.45", change: "+0.12%", isPositive: true },
  { symbol: "JPM", name: "JPMorgan Chase", value: "$222.10", change: "+0.48%", isPositive: true },
  { symbol: "NVO", name: "Novo Nordisk", value: "$115.30", change: "-0.45%", isPositive: false },
  { symbol: "USD/JPY", name: "Yen Dollar", value: "149.52", change: "+0.25%", isPositive: true },
];

/* ── 3. Top 20 Coin Vốn hóa (Crypto Market Cap) ── */
export const TOP20_COINS: MarketTicker[] = [
  { symbol: "BTC", name: "Bitcoin", value: "$81,750", change: "+2.35%", isPositive: true },
  { symbol: "ETH", name: "Ethereum", value: "$2,642", change: "+1.82%", isPositive: true },
  { symbol: "BNB", name: "Binance Coin", value: "$598.40", change: "+0.95%", isPositive: true },
  { symbol: "SOL", name: "Solana", value: "$156.80", change: "+4.21%", isPositive: true },
  { symbol: "XRP", name: "Ripple", value: "$0.548", change: "+1.10%", isPositive: true },
  { symbol: "DOGE", name: "Dogecoin", value: "$0.142", change: "+6.85%", isPositive: true },
  { symbol: "ADA", name: "Cardano", value: "$0.352", change: "+1.45%", isPositive: true },
  { symbol: "SUI", name: "Sui", value: "$2.15", change: "+8.40%", isPositive: true },
  { symbol: "AVAX", name: "Avalanche", value: "$28.60", change: "+3.12%", isPositive: true },
  { symbol: "LINK", name: "Chainlink", value: "$11.85", change: "+2.05%", isPositive: true },
  { symbol: "TON", name: "Toncoin", value: "$5.24", change: "-0.35%", isPositive: false },
  { symbol: "SHIB", name: "Shiba Inu", value: "$0.0000188", change: "+2.75%", isPositive: true },
  { symbol: "NEAR", name: "NEAR Protocol", value: "$5.12", change: "+4.80%", isPositive: true },
  { symbol: "DOT", name: "Polkadot", value: "$4.32", change: "+1.15%", isPositive: true },
  { symbol: "PEPE", name: "Pepe", value: "$0.0000104", change: "+5.90%", isPositive: true },
  { symbol: "TRX", name: "TRON", value: "$0.158", change: "+0.45%", isPositive: true },
  { symbol: "LTC", name: "Litecoin", value: "$71.20", change: "+1.25%", isPositive: true },
  { symbol: "BCH", name: "Bitcoin Cash", value: "$365.40", change: "+1.90%", isPositive: true },
  { symbol: "APT", name: "Aptos", value: "$10.15", change: "+5.10%", isPositive: true },
  { symbol: "UNI", name: "Uniswap", value: "$8.12", change: "+3.45%", isPositive: true },
];

export type MarketTab = "vn30" | "global30" | "crypto20";

export function BentoMarketStrip({
  className = "",
}: {
  className?: string;
}) {
  const [activeTab, setActiveTab] = React.useState<MarketTab>("vn30");
  const [cryptoList, setCryptoList] = React.useState<MarketTicker[]>(TOP20_COINS);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/market-tickers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.crypto?.length) {
          setCryptoList(data.crypto);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const currentList =
    activeTab === "vn30"
      ? VN30_TICKERS
      : activeTab === "global30"
      ? GLOBAL30_TICKERS
      : cryptoList;

  // Duplicate for seamless 60 FPS infinite loop
  const marqueeList = [...currentList, ...currentList];

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-emerald-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-emerald-200/80 p-4 md:p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <AmbientGlow color="rgba(16, 185, 129, 0.15)" size={200} className="-top-12 -left-12" />

      {/* Header with Live Status & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10 [html.light_&]:border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"  aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 [html.light_&]:text-emerald-700">
            Dữ liệu Tài chính 24/7
          </h3>
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 [html.light_&]:bg-emerald-50 text-emerald-300 [html.light_&]:text-emerald-800 border border-emerald-500/30 [html.light_&]:border-emerald-200">
            Trực tiếp 60 FPS
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-800/90 [html.light_&]:bg-slate-100 border border-white/10 [html.light_&]:border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("vn30")}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              activeTab === "vn30"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold"
                : "text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900"
            }`}
          >
            VN30 (30 Mã)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("global30")}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              activeTab === "global30"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md font-bold"
                : "text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900"
            }`}
          >
            Global 30 & Vàng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("crypto20")}
            className={`px-3 py-1 rounded-full transition-all duration-200 ${
              activeTab === "crypto20"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-bold"
                : "text-slate-400 [html.light_&]:text-slate-600 hover:text-white [html.light_&]:hover:text-slate-900"
            }`}
          >
            Top 20 Crypto
          </button>
        </div>
      </div>

      {/* 60 FPS Continuous Marquee Strip */}
      <div className="relative w-full overflow-hidden">
        <div className="animate-ticker-60fps flex gap-3 py-1">
          {marqueeList.map((t, idx) => (
            <div
              key={`${t.symbol}-${idx}`}
              className="flex-shrink-0 min-w-[155px] rounded-2xl border border-slate-700/80 [html.light_&]:border-slate-200/90 bg-slate-800/90 [html.light_&]:bg-slate-50/90 px-3.5 py-2.5 transition-all hover:scale-[1.03] hover:border-emerald-500/40 shadow-sm cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-black text-white [html.light_&]:text-slate-900 group-hover:text-emerald-300 [html.light_&]:group-hover:text-emerald-600 transition-colors tracking-tight">
                  {t.symbol}
                </span>
                <span
                  className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md ${
                    t.isPositive
                      ? "bg-emerald-500/20 [html.light_&]:bg-emerald-50 text-emerald-300 [html.light_&]:text-emerald-700 border border-emerald-500/40 [html.light_&]:border-emerald-300"
                      : "bg-rose-500/20 [html.light_&]:bg-rose-50 text-rose-300 [html.light_&]:text-rose-700 border border-rose-500/40 [html.light_&]:border-rose-300"
                  }`}
                >
                  {t.change}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span className="font-mono text-sm font-black text-slate-100 [html.light_&]:text-slate-900 tracking-tight">
                  {t.value}
                </span>
                {t.name && (
                  <span className="text-[10px] text-slate-400 [html.light_&]:text-slate-500 truncate max-w-[65px] font-medium">
                    {t.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    <div
      className={`rounded-3xl border border-amber-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-amber-200/80 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 [html.light_&]:border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping"  aria-hidden="true" />
          <h3 className="text-xs font-bold tracking-wider text-amber-300 [html.light_&]:text-amber-800 uppercase">
            {title}
          </h3>
        </div>
        <span className="text-[10px] text-amber-200 [html.light_&]:text-amber-700 font-mono font-medium">
          Live Briefing
        </span>
      </div>

      <div className="relative pl-3 space-y-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/20 [html.light_&]:before:bg-slate-300">
        {events.map((ev, idx) => (
          <div key={idx} className="relative group">
            <span
              className={`absolute -left-[11px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 [html.light_&]:border-white ${
                ev.urgency === "critical"
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  : ev.urgency === "high"
                  ? "bg-amber-400"
                  : "bg-slate-400"
              }`}
            />
            <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-amber-50/70 [html.light_&]:border-amber-200/70 p-3 hover:bg-slate-750 transition-colors shadow-sm">
              <span className="font-mono text-[11px] text-amber-300 [html.light_&]:text-amber-800 font-bold">
                {ev.time}
              </span>
              <p className="text-xs text-slate-100 [html.light_&]:text-slate-800 font-medium mt-1 line-clamp-2 leading-relaxed">
                {ev.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <div
      className={`relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-indigo-200/80 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <AmbientGlow color="rgba(99, 102, 241, 0.2)" size={160} className="-bottom-8 -right-8" />
      <div className="flex items-center gap-2 pb-3 border-b border-white/10 [html.light_&]:border-slate-200/80 mb-3">
        <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400"  aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 [html.light_&]:text-indigo-700">
          {label}
        </span>
      </div>
      <div className="rounded-xl bg-indigo-950/60 border border-indigo-500/40 [html.light_&]:bg-indigo-50/80 [html.light_&]:border-indigo-200 p-4">
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-3xl font-black text-white [html.light_&]:text-indigo-950">{metric}</span>
          <span className="text-xs text-indigo-300 [html.light_&]:text-indigo-700 font-bold">{unit}</span>
        </div>
        <p className="mt-2 text-xs text-slate-200 [html.light_&]:text-slate-700 font-medium leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

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
    <div
      className={`rounded-3xl border border-red-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-red-200/80 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 [html.light_&]:border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-red-400"  aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-300 [html.light_&]:text-red-700">
            {modelName}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-300 [html.light_&]:text-slate-600 font-medium">
          Spec Matrix
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50/90 [html.light_&]:border-slate-200/80 p-2.5 text-center shadow-sm">
          <div className="text-[11px] text-slate-300 [html.light_&]:text-slate-600 font-medium">0-100 km/h</div>
          <div className="font-mono text-base font-black text-red-400 mt-0.5">{accel}</div>
        </div>
        <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50/90 [html.light_&]:border-slate-200/80 p-2.5 text-center shadow-sm">
          <div className="text-[11px] text-slate-300 [html.light_&]:text-slate-600 font-medium">Tầm hoạt động</div>
          <div className="font-mono text-base font-black text-white [html.light_&]:text-slate-900 mt-0.5">{range}</div>
        </div>
        <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 [html.light_&]:bg-slate-50/90 [html.light_&]:border-slate-200/80 p-2.5 text-center shadow-sm">
          <div className="text-[11px] text-slate-300 [html.light_&]:text-slate-600 font-medium">Sạc nhanh</div>
          <div className="font-mono text-xs font-black text-emerald-400 mt-1">{charging}</div>
        </div>
      </div>
    </div>
  );
}

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
    <div
      className={`rounded-3xl border border-teal-500/30 bg-slate-900/90 [html.light_&]:bg-white/90 [html.light_&]:border-teal-200/80 p-5 shadow-2xl backdrop-blur-xl transition-colors duration-300 ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10 [html.light_&]:border-slate-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400"  aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 [html.light_&]:text-teal-700">
            Môi trường sống
          </span>
        </div>
        <span className="text-[11px] text-slate-300 [html.light_&]:text-slate-600 font-medium">{location}</span>
      </div>

      <div className="rounded-xl bg-teal-950/60 border border-teal-500/40 [html.light_&]:bg-teal-50/80 [html.light_&]:border-teal-200 p-3.5 flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-black text-teal-300 [html.light_&]:text-teal-700">{aqi}</span>
            <span className="text-xs text-teal-400 [html.light_&]:text-teal-600 font-bold">AQI</span>
          </div>
          <p className="text-xs text-slate-100 [html.light_&]:text-slate-800 font-medium mt-1">{status}</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-300 [html.light_&]:text-slate-600 font-medium">Chỉ số UV</span>
          <p className="text-xs font-mono font-bold text-amber-300 [html.light_&]:text-amber-700 mt-0.5">{uv}</p>
        </div>
      </div>
    </div>
  );
}
