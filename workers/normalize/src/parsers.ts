export interface ParsedFeedItem {
  externalId?: string;
  url: string;
  title?: string;
  publishedAt?: string;
  content?: string;
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
    const description = extractTag(block, "description");
    const url = link ?? guid;
    if (!url) continue;
    items.push({
      externalId: guid ?? undefined,
      url: decodeEntities(url),
      title: title === undefined ? undefined : decodeEntities(title),
      publishedAt:
        pubDate === undefined ? undefined : decodeEntities(pubDate),
      content:
        description === undefined
          ? undefined
          : decodeEntities(description),
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
    const updated = extractTag(block, "updated");
    const summary = extractTag(block, "summary");
    const link = extractAlternateLink(block) ?? id;
    if (!link) continue;
    items.push({
      externalId: id ?? undefined,
      url: decodeEntities(link),
      title: title === undefined ? undefined : decodeEntities(title),
      publishedAt:
        updated === undefined ? undefined : decodeEntities(updated),
      content:
        summary === undefined ? undefined : decodeEntities(summary),
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
    }>;
  };
  return (parsed.items ?? [])
    .map((item): ParsedFeedItem | undefined => {
      const url = item.url ?? item.external_url;
      if (!url) return undefined;
      return {
        externalId: item.id ?? undefined,
        url,
        title: item.title,
        publishedAt: item.date_published,
        content: item.content_html ?? item.content_text,
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

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
