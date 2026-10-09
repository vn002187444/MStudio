import type { D1Database } from "@cloudflare/workers-types";
import type {
  AgentRunRecord,
  AgentRunSourceRef,
} from "@mstudio/contracts";
import {
  createAgentRun,
  markAgentRunFailed,
  markAgentRunRunning,
  markAgentRunSucceeded,
} from "@mstudio/db";
import {
  ModelGatewayError,
  type ModelGateway,
} from "@mstudio/model-gateway";
import type {
  EvidenceVerificationOutput,
  StructuredClaim,
  StructuredFact,
  WriterOptions,
  WriterRequest,
} from "./types.ts";

export class WriterValidationError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "WriterValidationError";
    this.details = details;
  }
}

const SYSTEM_PROMPT = [
  "You are an evidence verification writer for a newsroom.",
  "Given a headline and the evidence text collected for that story,",
  "produce a structured verification as strict JSON with this shape:",
  '{"summary": string, "facts": [{"text": string, "sourceRefs": [{"sourceId": string}]}],',
  ' "claims": [{"text": string, "sourceRefs": [{"sourceId": string}], "confidence"?: number}]}.',
  "Every fact and claim MUST cite only sourceIds that appear in the",
  "provided evidence. Do not invent sources. Facts are statements",
  "directly supported by evidence; claims are assertions needing",
  "verification with a confidence between 0 and 1.",
  "Return JSON only, no prose or markdown fences.",
].join(" ");

export function buildPrompt(request: WriterRequest): string {
  const sources = request.evidence
    .map((ref) => `- ${ref.sourceId}`)
    .join("\n");
  return [
    `Headline: ${request.headline}`,
    "",
    "Evidence source IDs available for citation:",
    sources,
    "",
    "Evidence text:",
    request.evidenceText,
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSourceRef(value: unknown): value is AgentRunSourceRef {
  return isRecord(value) && typeof value.sourceId === "string";
}

function parseSourceRefs(value: unknown, where: string): AgentRunSourceRef[] {
  if (!Array.isArray(value)) {
    throw new WriterValidationError(`${where} sourceRefs must be an array`);
  }
  if (!value.every(isSourceRef)) {
    throw new WriterValidationError(
      `${where} sourceRefs entries must be { sourceId: string }`,
    );
  }
  return value;
}

function parseStructuredFact(fact: unknown, index: number): StructuredFact {
  if (!isRecord(fact) || typeof fact.text !== "string") {
    throw new WriterValidationError(`facts[${index}].text must be a string`);
  }
  return {
    text: fact.text,
    sourceRefs: parseSourceRefs(
      fact.sourceRefs,
      `facts[${index}]`,
    ),
  };
}

function parseStructuredClaim(claim: unknown, index: number): StructuredClaim {
  if (!isRecord(claim) || typeof claim.text !== "string") {
    throw new WriterValidationError(`claims[${index}].text must be a string`);
  }
  if (
    claim.confidence !== undefined &&
    (typeof claim.confidence !== "number" ||
      claim.confidence < 0 ||
      claim.confidence > 1)
  ) {
    throw new WriterValidationError(
      `claims[${index}].confidence must be a number between 0 and 1`,
    );
  }
  return {
    text: claim.text,
    sourceRefs: parseSourceRefs(
      claim.sourceRefs,
      `claims[${index}]`,
    ),
    confidence: claim.confidence as number | undefined,
  };
}

export function parseEvidenceOutput(
  text: string,
): EvidenceVerificationOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new WriterValidationError("output is not valid JSON");
  }
  if (!isRecord(parsed)) {
    throw new WriterValidationError("output must be a JSON object");
  }
  const { summary, facts, claims } = parsed;
  if (typeof summary !== "string" || summary.length === 0) {
    throw new WriterValidationError("output.summary must be a non-empty string");
  }
  if (!Array.isArray(facts)) {
    throw new WriterValidationError("output.facts must be an array");
  }
  if (!Array.isArray(claims)) {
    throw new WriterValidationError("output.claims must be an array");
  }
  const parsedFacts: StructuredFact[] = facts.map(parseStructuredFact);
  const parsedClaims: StructuredClaim[] = claims.map(parseStructuredClaim);
  return { summary, facts: parsedFacts, claims: parsedClaims };
}

export function validateSourceRefs(
  output: EvidenceVerificationOutput,
  allowed: AgentRunSourceRef[],
): void {
  const allowedIds = new Set(allowed.map((ref) => ref.sourceId));
  const errors: string[] = [];
  for (const fact of output.facts) {
    for (const ref of fact.sourceRefs) {
      if (!allowedIds.has(ref.sourceId)) {
        errors.push(
          `fact "${fact.text}" cites unknown source ${ref.sourceId}`,
        );
      }
    }
  }
  for (const claim of output.claims) {
    for (const ref of claim.sourceRefs) {
      if (!allowedIds.has(ref.sourceId)) {
        errors.push(
          `claim "${claim.text}" cites unknown source ${ref.sourceId}`,
        );
      }
    }
  }
  if (errors.length > 0) {
    throw new WriterValidationError(
      "output cites sources not present in the provided evidence",
      errors,
    );
  }
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof WriterValidationError) return true;
  if (error instanceof ModelGatewayError) {
    return (
      error.code === "TIMEOUT" || error.code === "PROVIDER_ERROR"
    );
  }
  return false;
}

function errorCode(error: unknown): string {
  if (error instanceof ModelGatewayError) return error.code;
  if (error instanceof WriterValidationError) return "VALIDATION";
  return "UNKNOWN";
}

export interface WriterDeps {
  db: D1Database;
  gateway: ModelGateway;
  options: WriterOptions;
}

export async function runEvidenceVerification(
  deps: WriterDeps,
  request: WriterRequest,
): Promise<{ output: EvidenceVerificationOutput; agentRun: AgentRunRecord }> {
  const { db, gateway, options } = deps;
  const agentRun = await createAgentRun(db, {
    id: crypto.randomUUID(),
    storyId: request.storyId,
    type: "evidence_verification",
    promptVersion: options.promptVersion,
    model: options.model,
    evidenceRefs: request.evidence,
    input: {
      headline: request.headline,
      evidenceText: request.evidenceText,
    },
    maxAttempts: options.maxAttempts,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    await markAgentRunRunning(db, agentRun.id);
    try {
      const response = await gateway.generate({
        model: options.model,
        prompt: buildPrompt(request),
        systemPrompt: SYSTEM_PROMPT,
        maxOutputTokens: options.maxOutputTokens,
        temperature: options.temperature,
      });
      const output = parseEvidenceOutput(response.text);
      validateSourceRefs(output, request.evidence);
      const succeeded = await markAgentRunSucceeded(db, agentRun.id, output);
      return { output, agentRun: succeeded ?? agentRun };
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) break;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "unknown error";
  await markAgentRunFailed(db, agentRun.id, {
    code: errorCode(lastError),
    message,
  });
  if (lastError instanceof Error) throw lastError;
  throw new Error(message);
}
