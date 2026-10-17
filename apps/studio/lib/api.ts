/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * Dùng direct worker endpoint https://mstudio-api.vn002187444.workers.dev
 * để tránh lỗi Cloudflare Same-Zone Subrequest Timeout (HTTP 522) khi
 * custom domain worker (mstudio.minds.io.vn) subrequest tới custom domain worker (api.mstudio.minds.io.vn).
 */
export function apiBaseUrl(): string {
  if (process.env.MSTUDIO_API_URL && !process.env.MSTUDIO_API_URL.includes("api.mstudio.minds.io.vn")) {
    return process.env.MSTUDIO_API_URL;
  }
  return "https://mstudio-api.vn002187444.workers.dev";
}

export function apiFallbackUrl(): string {
  return "https://api.mstudio.minds.io.vn";
}

/**
 * Resilient fetch helper: tries direct workers.dev first (bypassing same-zone 522),
 * and automatically falls back to custom domain if needed (or vice versa).
 */
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const normPath = path.startsWith("/") ? path : `/${path}`;
  const primaryUrl = `${apiBaseUrl()}${normPath}`;
  const fallbackUrl = `${apiFallbackUrl()}${normPath}`;

  try {
    const res = await fetch(primaryUrl, init);
    if (!res.ok && (res.status === 522 || res.status === 1042 || res.status >= 500)) {
      return await fetch(fallbackUrl, init);
    }
    return res;
  } catch {
    return await fetch(fallbackUrl, init);
  }
}

