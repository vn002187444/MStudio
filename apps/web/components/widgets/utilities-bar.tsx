"use client";

import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

interface WeatherData {
  temp: number;
  city: string;
}

interface MarketTicker {
  symbol: string;
  name?: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export function UtilitiesBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [tickers, setTickers] = useState<MarketTicker[]>([]);

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

    // 2. Real Live Tickers via /api/market-tickers
    fetch("/api/market-tickers")
      .then((res) => res.json() as Promise<{ crypto?: MarketTicker[] }>)
      .then((data) => {
        if (data.crypto && data.crypto.length > 0) {
          setTickers(data.crypto);
        }
      })
      .catch(() => {});
  }, []);

  // Double the list for seamless marquee
  const marqueeHighlights = tickers.length > 0 ? [...tickers, ...tickers] : [];

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
              <span aria-hidden="true">🌤️</span> {weather.city}: <strong className="text-slate-100 font-bold">{weather.temp}°C</strong>
            </span>
          )}

          {/* 60 FPS Micro Ticker */}
          <div className="relative overflow-hidden flex-1 min-w-[200px] max-w-[560px] hidden md:block">
            {marqueeHighlights.length > 0 && (
              <div className="animate-ticker-60fps flex items-center gap-4 text-[11px] font-mono">
                {marqueeHighlights.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 shrink-0">
                    <span className="font-bold text-slate-200">{m.symbol}</span>
                    <span className="text-slate-400">{m.value}</span>
                    <span className={`font-semibold ${m.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                      {m.change}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Live Pulse & Theme Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-cyan-400 font-semibold hidden lg:flex items-center gap-1.5 text-[11px]">
            <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Trực tiếp 24/7
          </span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
