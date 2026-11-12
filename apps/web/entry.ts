import vinextHandler from "vinext/server/fetch-handler";

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Chuẩn hóa trailing slash: chuyển hướng 301 vĩnh viễn sang URL tuyệt đối (SEO Canonicalization)
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      const cleanPath = url.pathname.replace(/\/+$/, "");
      const targetUrl = new URL(cleanPath + url.search, request.url);
      return new Response(null, {
        status: 301,
        headers: {
          Location: targetUrl.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

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
