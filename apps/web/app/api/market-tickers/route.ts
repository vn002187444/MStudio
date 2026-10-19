import { NextResponse } from "next/server";

export interface MarketTicker {
  symbol: string;
  name?: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export const revalidate = 60; // 1 minute cache

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    // Fetch live crypto prices from Binance public ticker API
    const cryptoRes = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbols=[%22BTCUSDT%22,%22ETHUSDT%22,%22BNBUSDT%22,%22SOLUSDT%22,%22XRPUSDT%22,%22DOGEUSDT%22,%22ADAUSDT%22,%22SUIUSDT%22,%22AVAXUSDT%22,%22LINKUSDT%22]", {
      signal: controller.signal,
      next: { revalidate: 60 },
    }).catch(() => null);

    clearTimeout(timeout);

    let cryptoTickers: MarketTicker[] | null = null;
    if (cryptoRes && cryptoRes.ok) {
      const data = await cryptoRes.json().catch(() => null);
      if (Array.isArray(data)) {
        cryptoTickers = data.map((item: any) => {
          const sym = item.symbol.replace("USDT", "");
          const price = parseFloat(item.lastPrice);
          const changePercent = parseFloat(item.priceChangePercent);
          const formattedPrice = price > 1000 ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 1 })}` : `$${price.toFixed(price < 1 ? 4 : 2)}`;
          const changeStr = `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
          return {
            symbol: sym,
            name: sym,
            value: formattedPrice,
            change: changeStr,
            isPositive: changePercent >= 0,
          };
        });
      }
    }

    return NextResponse.json({
      status: "ok",
      updatedAt: new Date().toISOString(),
      crypto: cryptoTickers,
    });
  } catch {
    return NextResponse.json({
      status: "fallback",
      updatedAt: new Date().toISOString(),
      crypto: null,
    });
  }
}
