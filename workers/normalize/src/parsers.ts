export interface ParsedFeedItem {
  externalId?: string;
  url: string;
  title?: string;
  publishedAt?: string;
  content?: string;
  /**
   * Tầng A media fallback (FU-15): URL ảnh gốc từ feed (enclosure /
   * media:content / JSONFeed image). Chỉ http(s). FE hotlink kèm credit;
   * tầng B (rehost R2) thay thế khi có media_assets.
   */
  imageUrl?: string;
}

export function parseFeed(
  content: string,
  contentType?: string,
): ParsedFeedItem[] {
  const trimmed = content.trimStart();
  if (
    contentType?.includes("json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    return parseJsonFeed(content);
  }
  if (/<entry[\s>]|<feed[\s>]/i.test(trimmed)) {
    return parseAtom(content);
  }
  return parseRss(content);
}

export function parseRss(content: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const itemPattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(content)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const guid = extractTag(block, "guid");
    const pubDate = extractTag(block, "pubDate");
    const encodedContent = extractTag(block, "content:encoded");
    const description = extractTag(block, "description");
    const rawContent = (encodedContent && encodedContent.length > 0) ? encodedContent : description;
    const url = link ?? guid;
    if (!url) continue;
    items.push({
      externalId: guid ?? undefined,
      url: cleanUrl(decodeEntities(url)),
      title: title === undefined ? undefined : decodeEntities(title),
      publishedAt:
        pubDate === undefined ? undefined : decodeEntities(pubDate),
      content:
        rawContent === undefined
          ? undefined
          : decodeEntities(rawContent),
      imageUrl: extractImageUrl(block),
    });
  }
  return items;
}

export function parseAtom(content: string): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const entryPattern = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(content)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const id = extractTag(block, "id");
    const published = extractTag(block, "published");
    const updated = extractTag(block, "updated");
    const contentTag = extractTag(block, "content");
    const summaryTag = extractTag(block, "summary");
    const mediaDescription = extractTag(block, "media:description");
    const rawContent =
      contentTag && contentTag.length > 0
        ? contentTag
        : summaryTag && summaryTag.length > 0
          ? summaryTag
          : mediaDescription;
    const link = extractAlternateLink(block) ?? id;
    if (!link) continue;
    items.push({
      externalId: id ?? undefined,
      url: cleanUrl(decodeEntities(link)),
      title: title === undefined ? undefined : decodeEntities(title),
      publishedAt:
        (published ?? updated) === undefined
          ? undefined
          : decodeEntities(published ?? updated!),
      content:
        rawContent === undefined ? undefined : decodeEntities(rawContent),
      imageUrl: extractImageUrl(block),
    });
  }
  return items;
}

export function parseJsonFeed(content: string): ParsedFeedItem[] {
  const parsed = JSON.parse(content) as {
    items?: Array<{
      id?: string;
      url?: string;
      external_url?: string;
      title?: string;
      date_published?: string;
      content_html?: string;
      content_text?: string;
      image?: string;
    }>;
  };
  return (parsed.items ?? [])
    .map((item): ParsedFeedItem | undefined => {
      const rawUrl = item.url ?? item.external_url;
      if (!rawUrl) return undefined;
      return {
        externalId: item.id ?? undefined,
        url: cleanUrl(decodeEntities(rawUrl)),
        title: item.title,
        publishedAt: item.date_published,
        content: item.content_html ?? item.content_text,
        imageUrl: pickHttpUrl(item.image),
      };
    })
    .filter((item): item is ParsedFeedItem => item !== undefined);
}

function extractTag(
  block: string,
  tag: string,
): string | undefined {
  const pattern = new RegExp(
    `<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i",
  );
  const match = pattern.exec(block);
  return match ? match[1].trim() : undefined;
}

/**
 * Chỉ chấp nhận http(s) — chặn javascript:/data: ngay tại parser (tầng A FU-15).
 */
function pickHttpUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = decodeEntities(raw.trim());
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

function attr(tag: string, name: string): string | undefined {
  const match = new RegExp(
    `${name}\\s*=\\s*["']([^"']+)["']`,
    "i",
  ).exec(tag);
  return match ? match[1] : undefined;
}

/**
 * Tầng A media fallback: lấy URL ảnh từ enclosure / media:content /
 * media:thumbnail / Atom link rel=enclosure. Chỉ nhận type image/* hoặc
 * medium="image" hoặc media:thumbnail (luôn là ảnh).
 */
function extractImageUrl(block: string): string | undefined {
  const tags = block.match(/<(enclosure|media:content|media:thumbnail|link)\b[^>]*\/?>/gi) ?? [];
  for (const tag of tags) {
    const name = /^<(\S+)/.exec(tag)?.[1].toLowerCase() ?? "";
    const type = attr(tag, "type") ?? "";
    const medium = attr(tag, "medium") ?? "";
    const rel = attr(tag, "rel") ?? "";
    if (name === "media:thumbnail") {
      const hit = pickHttpUrl(attr(tag, "url"));
      if (hit) return hit;
      continue;
    }
    if (name === "link" && rel.toLowerCase() !== "enclosure") continue;
    if (
      name === "media:content" ||
      type.toLowerCase().startsWith("image/") ||
      medium.toLowerCase() === "image"
    ) {
      const hit = pickHttpUrl(attr(tag, "url") ?? attr(tag, "href"));
      if (hit) return hit;
    }
  }

  // Xử lý các thẻ bị escaped trong XML (VD: &lt;img src="..."&gt;)
  const unescapedBlock = block
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  // Fallback: Tìm URL ảnh trong thẻ <img> của content/description (hỗ trợ cả data-src và src)
  const imgPattern = /<img\b[^>]*(?:data-src|src)=["']([^"']+)["']/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgPattern.exec(unescapedBlock)) !== null) {
    const hit = pickHttpUrl(imgMatch[1]);
    if (hit) return hit;
  }

  return undefined;
}

function extractAlternateLink(block: string): string | undefined {
  const alternate =
    /<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i.exec(
      block,
    ) ??
    /<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i.exec(
      block,
    );
  if (alternate) return alternate[1];
  const any = /<link\b[^>]*href=["']([^"']+)["']/i.exec(block);
  return any ? any[1] : undefined;
}

export function cleanUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const trackingPrefixes = ["utm_"];
    const trackingKeys = new Set([
      "fbclid",
      "gclid",
      "msclkid",
      "mc_cid",
      "mc_eid",
      "ref_src",
      "_ga",
      "_hsenc",
      "_hsmi",
    ]);
    const keysToDelete: string[] = [];
    for (const key of parsed.searchParams.keys()) {
      const lower = key.toLowerCase();
      if (
        trackingKeys.has(lower) ||
        trackingPrefixes.some((prefix) => lower.startsWith(prefix))
      ) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function decodeEntities(text: string): string {
  const unwrapped = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return unwrapped.replace(/&(?:[a-z\d]+|#\d+|#x[a-f\d]+);/gi, (entity) => {
    const lower = entity.toLowerCase();
    switch (lower) {
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
      case "&#39;":
        return "'";
      case "&nbsp;":
        return " ";
      case "&mdash;":
        return "—";
      case "&ndash;":
        return "–";
      case "&hellip;":
        return "…";
      case "&#8217;":
        return "'";
      case "&#8216;":
        return "'";
      case "&#8220;":
        return '"';
      case "&#8221;":
        return '"';
      case "&#038;":
        return "&";
      case "&copy;":
        return "©";
      case "&reg;":
        return "®";
      case "&trade;":
        return "™";
      case "&ocirc;":
        return "ô";
      case "&ecirc;":
        return "ê";
      case "&agrave;":
        return "à";
      case "&aacute;":
        return "á";
      case "&oacute;":
        return "ó";
      case "&ograve;":
        return "ò";
      case "&otilde;":
        return "õ";
      case "&ugrave;":
        return "ù";
      case "&uacute;":
        return "ú";
      case "&yacute;":
        return "ý";
      case "&atilde;":
        return "ã";
      case "&acirc;":
        return "â";
      case "&egrave;":
        return "è";
      case "&eacute;":
        return "é";
      case "&igrave;":
        return "ì";
      case "&iacute;":
        return "í";
      case "&icirc;":
        return "î";
      case "&iuml;":
        return "ï";
      case "&ccedil;":
        return "ç";
      case "&ntilde;":
        return "ñ";
      default:
        if (lower.startsWith("&#x")) {
          const code = parseInt(lower.slice(3, -1), 16);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        } else if (lower.startsWith("&#")) {
          const code = parseInt(lower.slice(2, -1), 10);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        }
        return entity;
    }
  });
}

