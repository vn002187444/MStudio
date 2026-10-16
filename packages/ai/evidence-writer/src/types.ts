import type { AgentRunSourceRef } from "@mstudio/contracts";

export interface StructuredFact {
  text: string;
  sourceRefs: AgentRunSourceRef[];
}

export interface StructuredClaim {
  text: string;
  sourceRefs: AgentRunSourceRef[];
  confidence?: number;
}

export interface EvidenceVerificationOutput {
  headline?: string;
  summary: string;
  facts: StructuredFact[];
  claims: StructuredClaim[];
}

export interface WriterRequest {
  storyId: string;
  headline: string;
  evidenceText: string;
  evidence: AgentRunSourceRef[];
}

export interface WriterOptions {
  promptVersion: string;
  model: string;
  maxAttempts: number;
  maxOutputTokens?: number;
  temperature?: number;
}

export const DEFAULT_WRITER_OPTIONS: WriterOptions = {
  promptVersion: "ev1",
  model: "gemini-3.1-flash-lite",
  maxAttempts: 3,
};
