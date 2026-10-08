import type {
  NormalizedFeedItem,
  NormalizeJobMessage,
} from "@mstudio/contracts";
import { createRawItem, getFeed } from "@mstudio/db";
import type { Logger } from "@mstudio/observability";
import { parseFeed, type ParsedFeedItem } from "./parsers.ts";
import { sha256Hex } from "./sha256.ts";

export function canonicalUrlCandidate(item: ParsedFeedItem): string {
  const externalId = item.externalId;
  if (externalId !== undefined && isHttpUrl(externalId)) {
    return externalId;
  }
  return item.url;
}

export async function normalizeParsedItems(
  items: ParsedFeedItem[],
): Promise<NormalizedFeedItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      externalId: item.externalId,
      url: item.url,
      canonicalUrl: canonicalUrlCandidate(item),
      title: item.title,
      publishedAt: item.publishedAt,
      payloadHash: await sha256Hex(
        JSON.stringify([
          item.url,
          item.title ?? "",
          item.publishedAt ?? "",
          item.content ?? "",
        ]),
      ),
    })),
  );
}

export interface NormalizeOutcome {
  created: number;
  duplicates: number;
}

export async function processNormalizeMessage(
  message: NormalizeJobMessage,
  env: Env,
  logger: Logger,
): Promise<NormalizeOutcome> {
  const bucket = env.RAW_BUCKET;
  const db = env.DB;
  if (!bucket || !db) {
    throw new Error("RAW_BUCKET and DB bindings must be configured");
  }
  const object = await bucket.get(message.hash);
  if (!object) {
    throw new Error(`raw content ${message.hash} not found in R2`);
  }
  const content = await object.text();
  const normalized = await normalizeParsedItems(parseFeed(content));
  const feed = await getFeed(db, message.feedId);
  if (!feed) {
    throw new Error(`feed ${message.feedId} not found`);
  }
  let created = 0;
  let duplicates = 0;
  for (const item of normalized) {
    const result = await createRawItem(db, {
      id: crypto.randomUUID(),
      feedId: feed.id,
      sourceId: feed.sourceId,
      externalId: item.externalId,
      url: item.url,
      canonicalUrl: item.canonicalUrl,
      title: item.title,
      publishedAt: item.publishedAt,
      fetchedAt: message.fetchedAt,
      payloadHash: item.payloadHash,
    });
    if (result.created) {
      created += 1;
    } else {
      duplicates += 1;
    }
  }
  logger.info("feed_normalized", {
    feedId: message.feedId,
    hash: message.hash,
    items: normalized.length,
    created,
    duplicates,
  });
  return { created, duplicates };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
