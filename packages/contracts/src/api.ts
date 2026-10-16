import type {
  AllowStatus,
  FeedFormat,
  FeedRecord,
  RawItemRecord,
  RightsStatus,
  SourceKind,
  SourceRecord,
} from "./domain.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export interface CreateSourceRequest {
  name: string;
  originUrl: string;
  kind: SourceKind;
  rightsStatus?: RightsStatus;
  allowStatus?: AllowStatus;
}

export interface CreateFeedRequest {
  url: string;
  format: FeedFormat;
  fetchIntervalSeconds?: number;
}

export interface UpdateSourceAllowStatusRequest {
  allowStatus: AllowStatus;
}

export interface UpdateSourceRequest {
  name?: string;
  originUrl?: string;
  allowStatus?: AllowStatus;
}

export interface UpdateFeedRequest {
  url?: string;
  format?: FeedFormat;
  fetchIntervalSeconds?: number;
  enabled?: boolean;
}

export interface ListRequest extends PageInput {}

export interface SourceResponse extends SourceRecord {}

export interface FeedResponse extends FeedRecord {}

export interface SourceListResponse extends PagedRows<SourceRecord> {}

export interface FeedListResponse extends PagedRows<FeedRecord> {}

export interface RawItemListResponse extends PagedRows<RawItemRecord> {}

export interface UpdateArticleRequest {
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  isBreaking?: boolean;
  isTrending?: boolean;
}

export interface SaveArticleRevisionRequest {
  title: string;
  body: string;
  summary?: string;
  metadata?: UpdateArticleRequest;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
