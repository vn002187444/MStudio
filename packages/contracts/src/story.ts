export type StoryStatus =
  | "draft"
  | "researching"
  | "ready"
  | "published"
  | "archived";

export type StorySourceRole = "primary" | "supporting" | "contradicting";

export type ClaimStatus = "pending" | "confirmed" | "refuted";

export type EntityKind =
  | "person"
  | "organization"
  | "location"
  | "event"
  | "concept"
  | "other";

export type StoryEntityRole =
  | "subject"
  | "mention"
  | "location"
  | "actor";

export interface StoryRecord {
  id: string;
  title: string;
  summary?: string;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StorySourceRecord {
  id: string;
  storyId: string;
  rawItemId: string;
  role: StorySourceRole;
  createdAt: string;
}

export interface FactRecord {
  id: string;
  storyId: string;
  text: string;
  sourceRefs: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimRecord {
  id: string;
  storyId: string;
  text: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EntityRecord {
  id: string;
  name: string;
  kind: EntityKind;
  normalizedName: string;
  createdAt: string;
}

export interface StoryEntityRecord {
  storyId: string;
  entityId: string;
  role: StoryEntityRole;
}
