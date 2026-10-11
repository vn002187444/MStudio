import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import type {
  DraftSource,
  RawItemAcceptResult,
  RawItemRecord,
  RawItemRejectResult,
  SourceRecord,
} from "@mstudio/contracts";
import {
  addRevision,
  addStorySource,
  createArticle,
  createEditorialDecision,
  createStory,
  getEditorialDecision,
  getSource,
  setRawItemStatus,
  type EditorialDecisionRecord,
} from "@mstudio/db";
import {
  DEFAULT_WRITER_OPTIONS,
  runEvidenceVerification,
  type EvidenceVerificationOutput,
} from "@mstudio/evidence-writer";
import { GeminiAdapter, ModelGateway } from "@mstudio/model-gateway";
import type { Logger } from "@mstudio/observability";

export class RawItemDecisionConflictError extends Error {
  readonly decision: EditorialDecisionRecord;

  constructor(message: string, decision: EditorialDecisionRecord) {
    super(message);
    this.name = "RawItemDecisionConflictError";
    this.decision = decision;
  }
}

export interface AcceptDeps {
  db: D1Database;
  rawBucket?: R2Bucket;
  gateway?: ModelGateway;
  actor: string;
  now?: string;
  logger?: Logger;
}

export interface RejectDeps {
  db: D1Database;
  actor: string;
  now?: string;
}

/**
 * Gemini chỉ qua ModelGateway (PLAN.md). Key đọc từ env GEMINI_API_KEY;
 * không có key -> undefined -> accept flow chạy fallback raw.
 */
export function buildDraftGateway(env: {
  GEMINI_API_KEY?: string;
}): ModelGateway | undefined {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return undefined;
  }
  return new ModelGateway({
    provider: new GeminiAdapter({ apiKey }),
  });
}

async function readRawPayload(
  rawBucket: R2Bucket | undefined,
  payloadHash: string,
): Promise<string | undefined> {
  if (!rawBucket) {
    return undefined;
  }
  try {
    const object = await rawBucket.get(payloadHash);
    if (!object) {
      return undefined;
    }
    return await object.text();
  } catch {
    return undefined;
  }
}

function fallbackTitle(
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
): string {
  return rawItem.title?.trim() || source?.name || rawItem.url;
}

function attributionBlock(
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
): string {
  const name = source?.name ?? rawItem.sourceId;
  const origin = source?.originUrl ?? rawItem.url;
  return `Nguồn: ${name} (${origin})\nOriginal: ${rawItem.url}`;
}

function truncateSummary(text: string, maxLength = 200): string {
  const flattened = text.replace(/\s+/g, " ").trim();
  if (flattened.length <= maxLength) {
    return flattened;
  }
  return `${flattened.slice(0, maxLength).trimEnd()}…`;
}

interface DraftContent {
  title: string;
  body: string;
  summary: string;
}

/**
 * Fallback raw: dùng nguyên nội dung raw item, KHÔNG bịa nội dung,
 * ghi rõ nguồn + link origin.
 */
function composeRawDraft(
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
  rawText: string | undefined,
): DraftContent {
  const title = fallbackTitle(rawItem, source);
  const content = rawText?.trim();
  const parts: string[] = [];
  if (content) {
    parts.push(content);
  } else if (rawItem.title?.trim()) {
    parts.push(rawItem.title.trim());
  }
  parts.push(attributionBlock(rawItem, source));
  return {
    title,
    body: parts.join("\n\n"),
    summary: content ? truncateSummary(content) : title,
  };
}

function composeAiDraft(
  output: EvidenceVerificationOutput,
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
): DraftContent {
  const title = fallbackTitle(rawItem, source);
  const lines: string[] = [output.summary, ""];
  if (output.facts.length > 0) {
    lines.push("Facts:");
    for (const fact of output.facts) {
      const refs = fact.sourceRefs.map((ref) => ref.sourceId).join(", ");
      lines.push(`- ${fact.text} (source: ${refs})`);
    }
  }
  if (output.claims.length > 0) {
    lines.push("");
    lines.push("Claims to verify:");
    for (const claim of output.claims) {
      const refs = claim.sourceRefs.map((ref) => ref.sourceId).join(", ");
      const confidence =
        claim.confidence !== undefined
          ? `, confidence ${claim.confidence}`
          : "";
      lines.push(`- ${claim.text} (source: ${refs}${confidence})`);
    }
  }
  lines.push("", attributionBlock(rawItem, source));
  return { title, body: lines.join("\n"), summary: output.summary };
}

/**
 * AI draft qua evidence-writer + ModelGateway. Thất bại (timeout /
 * provider error / validation) -> fallback raw, đánh dấu draft_source
 * "raw" và log warning — không fail request, web vẫn có bài.
 */
async function draftWithAi(
  deps: AcceptDeps,
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
  storyId: string,
  title: string,
  rawText: string | undefined,
): Promise<DraftContent | undefined> {
  if (!deps.gateway) {
    return undefined;
  }
  const evidenceText =
    rawText?.trim() ||
    [title, rawItem.url, rawItem.publishedAt]
      .filter(Boolean)
      .join("\n");
  try {
    const { output } = await runEvidenceVerification(
      {
        db: deps.db,
        gateway: deps.gateway,
        options: DEFAULT_WRITER_OPTIONS,
      },
      {
        storyId,
        headline: title,
        evidenceText,
        evidence: [
          {
            sourceId: rawItem.sourceId,
            snippet: evidenceText.slice(0, 500),
          },
        ],
      },
    );
    return composeAiDraft(output, rawItem, source);
  } catch (error) {
    deps.logger?.warn("draft_fallback_raw", {
      rawItemId: rawItem.id,
      code: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : "unknown error",
    });
    return undefined;
  }
}

/**
 * Accept raw item -> story + article (drafted) + revision đầu tiên.
 * Idempotent: accept 2 lần trả cùng ids, không tạo trùng rows.
 */
export async function acceptRawItem(
  deps: AcceptDeps,
  rawItem: RawItemRecord,
): Promise<RawItemAcceptResult> {
  const now = deps.now ?? new Date().toISOString();
  const existing = await getEditorialDecision(deps.db, rawItem.id);
  if (existing) {
    if (existing.decision === "accepted") {
      return {
        storyId: existing.storyId ?? "",
        articleId: existing.articleId ?? "",
        revisionId: existing.revisionId ?? "",
        draftSource: existing.draftSource ?? "raw",
        created: false,
      };
    }
    throw new RawItemDecisionConflictError(
      `raw item ${rawItem.id} was already rejected`,
      existing,
    );
  }

  const source = await getSource(deps.db, rawItem.sourceId);
  const rawText = await readRawPayload(deps.rawBucket, rawItem.payloadHash);
  const title = fallbackTitle(rawItem, source);

  const story = await createStory(deps.db, {
    id: crypto.randomUUID(),
    title,
    now,
  });

  const aiDraft = await draftWithAi(
    deps,
    rawItem,
    source,
    story.id,
    title,
    rawText,
  );
  const draft = aiDraft ?? composeRawDraft(rawItem, source, rawText);
  const draftSource: DraftSource = aiDraft ? "ai" : "raw";

  await addStorySource(deps.db, {
    id: crypto.randomUUID(),
    storyId: story.id,
    rawItemId: rawItem.id,
    role: "primary",
    now,
  });

  const article = await createArticle(deps.db, {
    id: crypto.randomUUID(),
    storyId: story.id,
    status: "drafted",
    now,
  });

  const revision = await addRevision(deps.db, {
    id: crypto.randomUUID(),
    articleId: article.id,
    title: draft.title,
    body: draft.body,
    summary: draft.summary,
    now,
  });

  await createEditorialDecision(deps.db, {
    id: crypto.randomUUID(),
    rawItemId: rawItem.id,
    decision: "accepted",
    storyId: story.id,
    articleId: article.id,
    revisionId: revision.id,
    draftSource,
    actor: deps.actor,
    decidedAt: now,
    now,
  });

  return {
    storyId: story.id,
    articleId: article.id,
    revisionId: revision.id,
    draftSource,
    created: true,
  };
}

/**
 * Reject raw item -> status discarded + editorial decision + audit log
 * (audit log do auditChanges middleware ghi). Idempotent.
 */
export async function rejectRawItem(
  deps: RejectDeps,
  rawItem: RawItemRecord,
): Promise<RawItemRejectResult> {
  const existing = await getEditorialDecision(deps.db, rawItem.id);
  if (existing) {
    if (existing.decision === "rejected") {
      return { rawItemId: rawItem.id, status: "discarded", created: false };
    }
    throw new RawItemDecisionConflictError(
      `raw item ${rawItem.id} was already accepted`,
      existing,
    );
  }
  const discarded = await setRawItemStatus(deps.db, rawItem.id, "discarded");
  if (!discarded) {
    throw new Error(`raw item ${rawItem.id} not found`);
  }
  await createEditorialDecision(deps.db, {
    id: crypto.randomUUID(),
    rawItemId: rawItem.id,
    decision: "rejected",
    actor: deps.actor,
    decidedAt: deps.now,
    now: deps.now,
  });
  return { rawItemId: rawItem.id, status: "discarded", created: true };
}
