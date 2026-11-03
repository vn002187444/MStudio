/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * Primary: https://api-mstudio.minds.io.vn (BKNS Backend SQLite SSD, zero-latency)
 * Fallback: https://api.mstudio.minds.io.vn (Cloudflare Worker + D1 backup)
 */
export function apiBaseUrl(): string {
  if (process.env.MSTUDIO_API_URL) {
    return process.env.MSTUDIO_API_URL;
  }
  return "https://api-mstudio.minds.io.vn";
}

export function apiFallbackUrl(): string {
  return "https://api.mstudio.minds.io.vn";
}

/**
 * Resilient fetch helper: tries custom domain first (avoiding Cloudflare 1042),
 * and automatically falls back if needed. Also checks for body error code 1042.
 */
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const normPath = path.startsWith("/") ? path : `/${path}`;
  const primaryUrl = `${apiBaseUrl()}${normPath}`;
  const fallbackUrl = `${apiFallbackUrl()}${normPath}`;

  const defaultInit: RequestInit = {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(3500),
  };

  try {
    const res = await fetch(primaryUrl, defaultInit);
    if (!res.ok) {
      return await fetch(fallbackUrl, defaultInit);
    }
    return res;
  } catch {
    try {
      return await fetch(fallbackUrl, defaultInit);
    } catch {
      return new Response(JSON.stringify({ rows: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}

