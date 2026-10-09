export type AgentRunStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface AgentRunSourceRef {
  sourceId: string;
  snippet?: string;
}

export interface AgentRunRecord {
  id: string;
  storyId?: string;
  jobId?: string;
  type: string;
  promptVersion: string;
  model: string;
  modelVersion?: string;
  evidenceRefs: AgentRunSourceRef[];
  input: unknown;
  output?: unknown;
  status: AgentRunStatus;
  errorCode?: string;
  errorMessage?: string;
  attempt: number;
  maxAttempts: number;
  reviewerDisposition?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface NewAgentRun {
  id: string;
  type: string;
  promptVersion: string;
  model: string;
  modelVersion?: string;
  storyId?: string;
  jobId?: string;
  evidenceRefs?: AgentRunSourceRef[];
  input: unknown;
  maxAttempts?: number;
  now?: string;
}
