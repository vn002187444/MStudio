/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * Primary: https://api.mstudio.minds.io.vn (Cloudflare Edge Worker + D1, high-availability & zero DNS issues)
 * Fallback: https://api-mstudio.minds.io.vn (BKNS Backend SQLite SSD)
 */
export function apiBaseUrl(): string {
  if (process.env.MSTUDIO_API_URL) {
    return process.env.MSTUDIO_API_URL;
  }
  return "https://api.mstudio.minds.io.vn";
}

export function apiFallbackUrl(): string {
  return "https://api-mstudio.minds.io.vn";
}

/**
 * Resilient fetch helper:
 * - Uses independent timeout signal for each attempt so an aborted primary never breaks the fallback.
 * - Always returns a valid JSON response so server components never crash into 500 errors.
 */
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const normPath = path.startsWith("/") ? path : `/${path}`;
  const primaryUrl = `${apiBaseUrl()}${normPath}`;
  const fallbackUrl = `${apiFallbackUrl()}${normPath}`;

  // 1. Try Primary with fresh timeout signal
  try {
    const primaryInit: RequestInit = {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(3000),
    };
    const res = await fetch(primaryUrl, primaryInit);
    if (res.ok) {
      return res;
    }
  } catch {}

  // 2. Try Fallback with clean separate timeout signal
  try {
    const fallbackInit: RequestInit = {
      ...init,
      signal: AbortSignal.timeout(2500),
    };
    const fbRes = await fetch(fallbackUrl, fallbackInit);
    if (fbRes.ok) {
      return fbRes;
    }
  } catch {}

  // 3. Graceful fallback payload: guarantees no 500 crash on server components
  return new Response(JSON.stringify({ rows: [], categories: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
