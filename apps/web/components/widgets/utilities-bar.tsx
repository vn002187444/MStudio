"use client";

import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

interface WeatherData {
  temp: number;
  city: string;
}

const TOP_HIGHLIGHTS = [
  { symbol: "VN-INDEX", val: "1.342,80", chg: "+1.24%", up: true },
  { symbol: "FPT", val: "142.800₫", chg: "+2.51%", up: true },
  { symbol: "VCB", val: "94.500₫", chg: "+1.18%", up: true },
  { symbol: "S&P 500", val: "5.864,20", chg: "+0.45%", up: true },
  { symbol: "VÀNG SJC", val: "86,5 tr", chg: "-0.23%", up: false },
  { symbol: "BTC", val: "$81.750", chg: "+2.35%", up: true },
  { symbol: "ETH", val: "$2.642", chg: "+1.82%", up: true },
  { symbol: "SOL", val: "$156,80", chg: "+4.21%", up: true },
];

export function UtilitiesBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [btcPrice, setBtcPrice] = useState<string>("81.750");

  useEffect(() => {
    // 1. Open-Meteo API
    fetch("https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&current_weather=true")
      .then((res) => res.json() as Promise<{ current_weather?: { temperature: number } }>)
      .then((data) => {
        if (data.current_weather) {
          setWeather({
            city: "Hà Nội",
            temp: Math.round(data.current_weather.temperature),
          });
        }
      })
      .catch(() => {});

    // 2. Binance Ticker
    fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")
      .then((res) => res.json() as Promise<{ price?: string }>)
      .then((data) => {
        if (data.price) {
          const num = parseFloat(data.price);
          if (!isNaN(num)) {
            setBtcPrice(num.toLocaleString("en-US", { maximumFractionDigits: 0 }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const marqueeHighlights = [...TOP_HIGHLIGHTS, ...TOP_HIGHLIGHTS];

  return (
    <div className="utilities-bar bg-[#07080B]/95 border-b border-white/10 text-xs text-slate-300 py-1.5 px-4 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1680px] mx-auto flex justify-between items-center flex-wrap gap-2">
        {/* Left side: Date, Weather & Marquee Ticker */}
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <span className="font-semibold text-slate-200 shrink-0">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "numeric",
            })}
          </span>

          {weather && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 shrink-0">
              🌤️ {weather.city}: <strong className="text-slate-100 font-bold">{weather.temp}°C</strong>
            </span>
          )}

          {/* 60 FPS Micro Ticker */}
          <div className="relative overflow-hidden flex-1 min-w-[200px] max-w-[560px] hidden md:block">
            <div className="animate-ticker-60fps flex items-center gap-4 text-[11px] font-mono">
              {marqueeHighlights.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1 shrink-0">
                  <span className="font-bold text-slate-200">{m.symbol}</span>
                  <span className="text-slate-400">{m.symbol === "BTC" ? `$${btcPrice}` : m.val}</span>
                  <span className={`font-semibold ${m.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {m.chg}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Live Pulse & Theme Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-cyan-400 font-semibold hidden lg:flex items-center gap-1.5 text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Trực tiếp 24/7
          </span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
