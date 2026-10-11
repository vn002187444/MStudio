/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * - Local/dev: đặt MSTUDIO_API_URL hoặc mặc định API prod.
 * - Production Worker: env build-time không tồn tại ở runtime nên
 *   default thẳng về API prod. Đây là app leaf nên được phép biết
 *   backend của nó (không áp cho domain packages).
 */
export function apiBaseUrl(): string {
  return (
    process.env.MSTUDIO_API_URL ??
    "https://mstudio-api.vn002187444.workers.dev"
  );
}
