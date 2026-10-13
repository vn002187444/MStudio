/**
 * CMS Direct Login Gateway (Task MST-094)
 * Redirects HTTP 302 immediately to Studio Login on Cloudflare Workers.
 */
export function GET() {
  return Response.redirect("https://studio.vn002187444.workers.dev/login", 302);
}
