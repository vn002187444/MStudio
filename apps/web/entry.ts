import vinextHandler from "vinext/server/fetch-handler";

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const response = await (vinextHandler as any).fetch(request, env, ctx);

    // Cache-Control Edge Header for public pages to ensure sub-50ms TTFB
    if (
      response.status === 200 &&
      (url.pathname === "/" ||
        url.pathname.startsWith("/bai-viet/") ||
        url.pathname.startsWith("/chuyen-muc/") ||
        url.pathname.startsWith("/thoi-su") ||
        url.pathname.startsWith("/cong-nghe") ||
        url.pathname.startsWith("/kinh-te") ||
        url.pathname.startsWith("/khoa-hoc") ||
        url.pathname.startsWith("/the-thao") ||
        url.pathname.startsWith("/the-gioi") ||
        url.pathname.startsWith("/doi-song") ||
        url.pathname.startsWith("/giai-tri") ||
        url.pathname.startsWith("/ai-channel"))
    ) {
      const headers = new Headers(response.headers);
      headers.set(
        "Cache-Control",
        "public, max-age=60, s-maxage=180, stale-while-revalidate=600"
      );
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
