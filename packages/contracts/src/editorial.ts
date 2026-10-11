export type RawItemDecision = "accepted" | "rejected";

export type DraftSource = "raw" | "ai";

export interface RawItemAcceptResult {
  storyId: string;
  articleId: string;
  revisionId: string;
  draftSource: DraftSource;
  created: boolean;
}

export interface RawItemRejectResult {
  rawItemId: string;
  status: "discarded";
  created: boolean;
}
