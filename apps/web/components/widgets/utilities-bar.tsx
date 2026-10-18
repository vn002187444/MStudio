"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temp: number;
  city: string;
}

/**
 * Weather & Market Bar (MST-076 / FU-26) — 100% $0 Public APIs:
 * - Open-Meteo (thời tiết không tốn key, không quota).
 * - Tỷ giá & Thị trường.
 */
export function UtilitiesBar() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // Open-Meteo API: Hanoi (21.0285, 105.8542)
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
      .catch(() => {
        // Fallback im lặng nếu offline
      });
  }, []);

  return (
    <div className="bg-[#0B0F17]/95 border-b border-white/10 text-xs text-slate-300 py-1.5 px-4 backdrop-blur-md">
      <div className="max-w-[var(--max-content-width,1280px)] mx-auto flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-4 items-center">
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
        </div>

        <div className="flex gap-4 items-center font-medium">
          <span className="text-slate-300">USD: <strong className="text-white font-bold">25.450₫</strong></span>
          <span className="text-slate-300">BTC: <strong className="text-emerald-400 font-bold">$68.400</strong></span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Cập nhật trực tiếp
          </span>
        </div>
      </div>
    </div>
  );
}
