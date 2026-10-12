/**
 * API base URL duy nhất cho apps/web (mọi fetch server-side).
 * - Local/dev: đặt MSTUDIO_API_URL hoặc mặc định API prod.
 * - Production Worker: env build-time không tồn tại ở runtime nên
 *   default thẳng về API prod (custom domain — workers.dev gây
 *   error 1042 loop prevention khi worker cùng account fetch nhau).
 */
export function apiBaseUrl(): string {
  return (
    process.env.MSTUDIO_API_URL ??
    "https://api.mstudio.minds.io.vn"
  );
}
