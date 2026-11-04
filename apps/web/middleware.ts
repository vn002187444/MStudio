import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 🛑 Danh sách scraper bot càn quét quá khích cần chặn đứng ngay lập tức tại Edge
const BLOCKED_BOT_REGEX = /Reflectionbot|Bytespider|PetalBot|Amazonbot/i;

// 🟢 Danh sách AI Search & SEO Indexers chính thống được chào đón
const ALLOWED_AI_SEARCH_BOT_REGEX = /GPTBot|OAI-SearchBot|ClaudeBot|PerplexityBot|Applebot|Googlebot|Bingbot/i;

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";

  // 1. Chặn đứng abusive scrapers ngay tại Edge (0.01ms CPU, không tốn tài nguyên SSR/Worker)
  if (BLOCKED_BOT_REGEX.test(userAgent)) {
    return new NextResponse("Access Forbidden: Aggressive scraper bot blocked.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Gắn cờ nhận diện cho AI Search Bots hợp lệ
  if (ALLOWED_AI_SEARCH_BOT_REGEX.test(userAgent)) {
    response.headers.set("X-AI-Bot-Status", "allowed-indexer");
  }

  // Cloudflare Edge Cache-Control for public article routes
  if (request.nextUrl.pathname.startsWith("/bai-viet/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
    );
  }

  return response;
}
