import type {
  AllowStatus,
  FeedFormat,
  FeedRecord,
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

export interface UpdateFeedRequest {
  enabled: boolean;
}

export interface ListRequest extends PageInput {}

export interface SourceResponse extends SourceRecord {}

export interface FeedResponse extends FeedRecord {}

export interface SourceListResponse extends PagedRows<SourceRecord> {}

export interface FeedListResponse extends PagedRows<FeedRecord> {}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
