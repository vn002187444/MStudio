/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * Dùng direct worker endpoint https://mstudio-api.vn002187444.workers.dev
 * để tránh lỗi Cloudflare Same-Zone Subrequest Timeout (HTTP 522) khi
 * custom domain worker (mstudio.minds.io.vn) subrequest tới custom domain worker (api.mstudio.minds.io.vn).
 */
export function apiBaseUrl(): string {
  if (process.env.MSTUDIO_API_URL) {
    return process.env.MSTUDIO_API_URL;
  }
  return "https://api.mstudio.minds.io.vn";
}
