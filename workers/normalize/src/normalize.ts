import type {
  NormalizedFeedItem,
  NormalizeJobMessage,
} from "@mstudio/contracts";
import {
  createMediaAsset,
  createRawItems,
  getFeed,
  getSource,
} from "@mstudio/db";
import type { Logger } from "@mstudio/observability";
import { isRehostable, rehostImage } from "./media.ts";
import { parseFeed, type ParsedFeedItem } from "./parsers.ts";
import { sha256Hex } from "./sha256.ts";

export interface NormalizedItem extends NormalizedFeedItem {
  imageUrl?: string;
}

export function canonicalUrlCandidate(item: ParsedFeedItem): string {
  const externalId = item.externalId;
  if (externalId !== undefined && isHttpUrl(externalId)) {
    return externalId;
  }
  return item.url;
}

export async function normalizeParsedItems(
  items: ParsedFeedItem[],
): Promise<NormalizedItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      externalId: item.externalId,
      url: item.url,
      canonicalUrl: canonicalUrlCandidate(item),
      title: item.title,
      publishedAt: item.publishedAt,
      imageUrl: item.imageUrl,
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

export interface NormalizeOptions {
  fetchImage?: (url: string) => Promise<Response>;
}

export interface NormalizeOutcome {
  created: number;
  duplicates: number;
}

export async function processNormalizeMessage(
  message: NormalizeJobMessage,
  env: Env,
  logger: Logger,
  options: NormalizeOptions = {},
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
  const source = await getSource(db, feed.sourceId);
  const inputs = normalized.map((item) => ({
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
    imageUrl: item.imageUrl,
  }));

  const { created, duplicates } = await createRawItems(db, inputs);
  if (source && isRehostable(source.rightsStatus)) {
    try {
      await rehostImages(
        bucket,
        db,
        normalized.slice(0, 3),
        source.rightsStatus,
        logger,
        options,
      );
    } catch (error) {
      logger.error("batch_rehost_images_failed", {
        feedId: feed.id,
        error: error instanceof Error ? error.message : "unknown error",
      });
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

async function rehostImages(
  bucket: Env["RAW_BUCKET"],
  db: D1Database,
  items: NormalizedItem[],
  rightsStatus: "clear" | "licensed",
  logger: Logger,
  options: NormalizeOptions,
): Promise<void> {
  for (const item of items) {
    if (!item.imageUrl) {
      continue;
    }
    try {
      const r2Key = await rehostImage(bucket, item.imageUrl, {
        fetchImage: options.fetchImage,
      });
      await createMediaAsset(db, {
        id: crypto.randomUUID(),
        originUrl: item.imageUrl,
        r2Key,
        rightsStatus,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn("media_rehost_failed", {
        url: item.imageUrl,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
