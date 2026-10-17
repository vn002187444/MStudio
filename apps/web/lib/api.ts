/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * Dùng custom domain https://api.mstudio.minds.io.vn làm primary URL
 * vì Cloudflare cấm worker -> worker subrequest qua *.workers.dev (lỗi Error Code 1042 / HTTP 404).
 */
export function apiBaseUrl(): string {
  if (process.env.MSTUDIO_API_URL) {
    return process.env.MSTUDIO_API_URL;
  }
  return "https://api.mstudio.minds.io.vn";
}

export function apiFallbackUrl(): string {
  return "https://mstudio-api.vn002187444.workers.dev";
}

/**
 * Resilient fetch helper: tries custom domain first (avoiding Cloudflare 1042),
 * and automatically falls back if needed. Also checks for body error code 1042.
 */
export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  const normPath = path.startsWith("/") ? path : `/${path}`;
  const primaryUrl = `${apiBaseUrl()}${normPath}`;
  const fallbackUrl = `${apiFallbackUrl()}${normPath}`;

  try {
    const res = await fetch(primaryUrl, init);
    if (!res.ok) {
      return await fetch(fallbackUrl, init);
    }
    return res;
  } catch {
    return await fetch(fallbackUrl, init);
  }
}
