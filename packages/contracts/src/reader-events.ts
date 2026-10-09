export type ReaderEventType =
  | "open_article"
  | "meaningful_read"
  | "follow_topic"
  | "hide_topic"
  | "share"
  | "save";

export const MEANINGFUL_READER_EVENT_TYPES: readonly ReaderEventType[] = [
  "open_article",
  "meaningful_read",
  "follow_topic",
  "hide_topic",
  "share",
  "save",
];

export function isMeaningfulReaderEventType(
  value: string,
): value is ReaderEventType {
  return (MEANINGFUL_READER_EVENT_TYPES as readonly string[]).includes(value);
}

export interface ReaderEventInput {
  userId?: string;
  eventType: string;
  articleId?: string;
  topicId?: string;
  url?: string;
  occurredAt?: string;
}

export interface ReaderEventMessage {
  id: string;
  userId?: string;
  eventType: string;
  articleId?: string;
  topicId?: string;
  url?: string;
  occurredAt: string;
}

export interface NewReaderEvent extends ReaderEventMessage {
  createdAt: string;
}

export interface ReaderEventRecord {
  id: string;
  userId?: string;
  eventType: string;
  articleId?: string;
  topicId?: string;
  url?: string;
  occurredAt: string;
  createdAt: string;
}

export interface ReaderProfileRecord {
  userId: string;
  followedTopicIds: string[];
  hiddenTopicIds: string[];
  updatedAt: string;
}

export interface ReaderEventsIngestResponse {
  accepted: number;
  sampledOut: number;
}
