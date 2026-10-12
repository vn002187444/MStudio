/**
 * Shared CMS helpers (server-safe — không chạm localStorage ở đây).
 * Mirror thu gọn từ packages/contracts (TODO MST-002: import trực tiếp
 * khi apps/studio wire workspace dep).
 */

export type ArticleStatus =
  | "drafted"
  | "ai_qa"
  | "human_review"
  | "auto_eligible"
  | "hold"
  | "scheduled"
  | "published"
  | "updated"
  | "corrected"
  | "retracted";

export const ARTICLE_TRANSITIONS: Record<ArticleStatus, readonly ArticleStatus[]> = {
  drafted: ["ai_qa"],
  ai_qa: ["human_review", "auto_eligible", "hold"],
  human_review: ["auto_eligible", "hold", "scheduled"],
  auto_eligible: ["scheduled"],
  hold: ["human_review"],
  scheduled: ["published"],
  published: ["updated", "corrected", "retracted"],
  updated: ["corrected", "retracted", "published"],
  corrected: ["updated", "retracted"],
  retracted: [],
};

export const REVIEW_STATUSES: readonly ArticleStatus[] = [
  "drafted",
  "ai_qa",
  "human_review",
  "auto_eligible",
  "hold",
  "scheduled",
];

export interface KeysetCursor {
  createdAt: string;
  id: string;
}

export interface ArticleRow {
  id: string;
  storyId: string;
  status: ArticleStatus;
  currentRevisionId?: string;
  publishedRevisionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListResponse {
  rows: ArticleRow[];
  nextCursor?: KeysetCursor;
}

export interface PublishedArticleRow {
  id: string;
  storyId: string;
  status: ArticleStatus;
  title: string;
  summary?: string;
  publishedRevisionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceRow {
  id: string;
  name: string;
  originUrl: string;
  kind: string;
  allowStatus: string;
}

export interface FeedRow {
  id: string;
  sourceId: string;
  url: string;
  format: string;
  enabled: boolean;
}

export function apiBaseUrl(): string {
  return process.env.MSTUDIO_API_URL ?? "http://localhost:8787";
}

export function publishBaseUrl(): string {
  return (
    process.env.MSTUDIO_PUBLISH_URL ??
    "https://mstudio-publish.vn002187444.workers.dev"
  );
}

export function webBaseUrl(): string {
  return process.env.MSTUDIO_WEB_URL ?? "https://mstudio.minds.io.vn";
}

const dateTimeFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatTime(iso?: string): string {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "—";
  return dateTimeFormat.format(new Date(iso));
}
