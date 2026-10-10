export interface NormalizeJobMessage {
  feedId: string;
  hash: string;
  fetchedAt: string;
  byteLength: number;
}

export interface NormalizedFeedItem {
  externalId?: string;
  url: string;
  canonicalUrl?: string;
  title?: string;
  publishedAt?: string;
  payloadHash: string;
  /** Tầng A media fallback (FU-15): URL ảnh gốc từ feed, chỉ http(s). */
  imageUrl?: string;
}
