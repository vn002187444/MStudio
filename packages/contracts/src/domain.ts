export type SourceKind = "rss" | "sitemap" | "api" | "manual";
export type RightsStatus = "clear" | "licensed" | "unknown";
export type AllowStatus = "approved" | "denied" | "pending";
export type FeedFormat = "rss" | "atom" | "jsonfeed" | "sitemap";
export type RawItemStatus =
  | "incoming"
  | "normalized"
  | "clustered"
  | "discarded";
export type JobStatus = "pending" | "running" | "succeeded" | "failed";
export type UserRole = "admin" | "editor" | "reviewer" | "seo" | "analyst";

export interface SourceRecord {
  id: string;
  name: string;
  originUrl: string;
  kind: SourceKind;
  rightsStatus: RightsStatus;
  allowStatus: AllowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FeedRecord {
  id: string;
  sourceId: string;
  url: string;
  format: FeedFormat;
  enabled: boolean;
  fetchIntervalSeconds: number;
  lastFetchedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawItemRecord {
  id: string;
  feedId: string;
  sourceId: string;
  externalId?: string;
  url: string;
  canonicalUrl?: string;
  title?: string;
  publishedAt?: string;
  fetchedAt: string;
  payloadHash: string;
  status: RawItemStatus;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  type: string;
  status: JobStatus;
  payload: string;
  attempt: number;
  maxAttempts: number;
  correlationId?: string;
  errorCode?: string;
  errorMessage?: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
