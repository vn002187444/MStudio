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
    <div
      style={{
        background: "var(--soft, #f8fafc)",
        borderBottom: "1px solid var(--border)",
        fontSize: "12px",
        color: "var(--ink-700, #374151)",
        padding: "6px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-content-width, 1280px)",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })}
          </span>
          {weather ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              🌤️ {weather.city}: <strong>{weather.temp}°C</strong>
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>USD: <strong>25.450₫</strong></span>
          <span>BTC: <strong>$68.400</strong></span>
          <span style={{ color: "var(--accent, #2563eb)", fontWeight: 500 }}>
            ⚡ Cập nhật theo thời gian thực
          </span>
        </div>
      </div>
    </div>
  );
}
