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
}
