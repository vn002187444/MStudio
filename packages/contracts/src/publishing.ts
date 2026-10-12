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

export const ARTICLE_TRANSITIONS: Record<
  ArticleStatus,
  readonly ArticleStatus[]
> = {
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

export const ARTICLE_STATUSES = Object.keys(
  ARTICLE_TRANSITIONS,
) as ArticleStatus[];

export function isArticleStatus(value: string): value is ArticleStatus {
  return ARTICLE_STATUSES.includes(value as ArticleStatus);
}

export function canTransition(
  from: ArticleStatus,
  to: ArticleStatus,
): boolean {
  return (ARTICLE_TRANSITIONS[from] ?? []).includes(to);
}

export function validateTransition(
  from: ArticleStatus,
  to: ArticleStatus,
): { ok: true } | { ok: false; allowed: readonly ArticleStatus[] } {
  if (canTransition(from, to)) return { ok: true };
  return { ok: false, allowed: ARTICLE_TRANSITIONS[from] ?? [] };
}

export function isTerminal(status: ArticleStatus): boolean {
  return ARTICLE_TRANSITIONS[status].length === 0;
}

export function isPublishedState(status: ArticleStatus): boolean {
  return (
    status === "published" ||
    status === "updated" ||
    status === "corrected" ||
    status === "retracted"
  );
}

export interface ArticleRecord {
  id: string;
  storyId: string;
  status: ArticleStatus;
  currentRevisionId?: string;
  publishedRevisionId?: string;
  publishKey?: string;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  sourceCount: number;
  qualityScore?: number;
  isBreaking: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedArticleRecord {
  id: string;
  storyId: string;
  status: ArticleStatus;
  title: string;
  body: string;
  summary?: string;
  publishedRevisionId: string;
  slug?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  keywords?: string;
  sourceCount: number;
  qualityScore?: number;
  isBreaking: boolean;
  isTrending: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface ArticleSourceLink {
  name: string;
  originUrl: string;
  rightsStatus: string;
  role: "primary" | "supporting" | "contradicting";
}

export interface PublishedArticleDetailRecord extends PublishedArticleRecord {
  sources: ArticleSourceLink[];
}

