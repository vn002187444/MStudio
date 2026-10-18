"use client";

import { useEffect, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

interface WeatherData {
  temp: number;
  city: string;
}

/**
 * Weather & Market Bar (MST-076 / FU-26) — 100% $0 Public APIs:
 * - Open-Meteo (thời tiết không tốn key, không quota).
 * - Binance Public Ticker (giá BTC trực tiếp độ trễ cực thấp).
 * - Theme Switcher (Tối / Sáng / Tự động chuyển đổi).
 */
export function UtilitiesBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [btcPrice, setBtcPrice] = useState<string>("81.750");

  useEffect(() => {
    // 1. Open-Meteo API: Hanoi (21.0285, 105.8542)
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

    // 2. Binance Public Ticker: BTC/USDT live price
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

  return (
    <div className="bg-[#07080B]/95 border-b border-white/10 text-xs text-slate-300 py-1.5 px-4 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1680px] mx-auto flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-4 items-center flex-wrap">
          <span className="font-semibold text-slate-200">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </span>
          {weather ? (
            <span className="flex items-center gap-1.5 text-slate-300">
              🌤️ {weather.city}: <strong className="text-white font-bold">{weather.temp}°C</strong>
            </span>
          ) : null}
          <div className="hidden sm:flex gap-3 items-center font-medium border-l border-white/10 pl-3">
            <span className="text-slate-300">USD: <strong className="text-white font-bold">25.450₫</strong></span>
            <span className="text-slate-300">BTC: <strong className="text-emerald-400 font-bold">${btcPrice}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-cyan-400 font-semibold hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Trực tiếp 24/7
          </span>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
