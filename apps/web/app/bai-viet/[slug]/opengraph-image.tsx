import { ImageResponse } from "@vercel/og";
import { apiBaseUrl } from "../../../lib/api";

/**
 * OG image động cho bài viết (proposal §7): render từ tiêu đề + brand,
 * monochrome editorial đúng tokens. Edge runtime (workerd).
 */
export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

let cachedFont: ArrayBuffer | undefined;

async function interFont(): Promise<ArrayBuffer | undefined> {
  if (cachedFont) return cachedFont;
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2",
    );
    if (!response.ok) return undefined;
    cachedFont = await response.arrayBuffer();
    return cachedFont;
  } catch {
    return undefined;
  }
}

interface PublishedArticle {
  title: string;
  summary?: string;
}

async function fetchTitle(slug: string): Promise<PublishedArticle | undefined> {
  try {
    const response = await fetch(
      `${apiBaseUrl()}/articles/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return undefined;
    const payload = (await response.json()) as {
      article?: PublishedArticle;
    };
    return payload.article;
  } catch {
    return undefined;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  // Tạm thời: title tĩnh để cô lập lỗi 500 (nghi fetch `next:revalidate`
  // trong route OG). Khôi phục fetchTitle khi route xanh.
  const title = "MStudio Channel";
  const summary: string | undefined = undefined;
  void fetchTitle;
  void slug;

  const font = await interFont();
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "#090909",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 80,
          width: "100%",
        }}
      >
        <div style={{ color: "#FFFFFF", fontSize: 32, letterSpacing: 4 }}>
          MSTUDIO CHANNEL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>
            {title.length > 110 ? `${title.slice(0, 110)}…` : title}
          </div>
          <div style={{ color: "#E3E3E3", fontSize: 30 }}>{summary}</div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(font ? { fonts: [{ name: "Inter", data: font, weight: 700 as const }] } : {}),
    },
  );
}
