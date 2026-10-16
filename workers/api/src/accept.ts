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

export function decodeEntities(text: string): string {
  const unwrapped = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return unwrapped.replace(/&(?:[a-z\d]+|#\d+|#x[a-f\d]+);/gi, (entity) => {
    const lower = entity.toLowerCase();
    switch (lower) {
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
      case "&#39;":
        return "'";
      case "&nbsp;":
        return " ";
      case "&mdash;":
        return "—";
      case "&ndash;":
        return "–";
      case "&hellip;":
        return "…";
      case "&#8217;":
      case "&#8216;":
        return "'";
      case "&#8220;":
      case "&#8221;":
        return '"';
      case "&#038;":
        return "&";
      case "&copy;":
        return "©";
      case "&reg;":
        return "®";
      case "&trade;":
        return "™";
      case "&ocirc;":
        return "ô";
      case "&ecirc;":
        return "ê";
      case "&agrave;":
        return "à";
      case "&aacute;":
        return "á";
      case "&oacute;":
        return "ó";
      case "&ograve;":
        return "ò";
      case "&otilde;":
        return "õ";
      case "&ugrave;":
        return "ù";
      case "&uacute;":
        return "ú";
      case "&yacute;":
        return "ý";
      case "&atilde;":
        return "ã";
      case "&acirc;":
        return "â";
      case "&egrave;":
        return "è";
      case "&eacute;":
        return "é";
      case "&igrave;":
        return "ì";
      case "&iacute;":
        return "í";
      case "&icirc;":
        return "î";
      case "&iuml;":
        return "ï";
      case "&ccedil;":
        return "ç";
      case "&ntilde;":
        return "ñ";
      default:
        if (lower.startsWith("&#x")) {
          const code = parseInt(lower.slice(3, -1), 16);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        } else if (lower.startsWith("&#")) {
          const code = parseInt(lower.slice(2, -1), 10);
          if (!isNaN(code) && code > 0 && code <= 0x10ffff) {
            return String.fromCodePoint(code);
          }
        }
        return entity;
    }
  });
}

function fallbackTitle(
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
): string {
  const raw = rawItem.title?.trim() || source?.name || rawItem.url;
  return decodeEntities(raw);
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

export function generateSlug(text: string): string {
  const normalized = decodeEntities(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return normalized || `tin-tuc-${Date.now()}`;
}

export function inferCategorySlug(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  if (/ai|trí tuệ nhân tạo|bán dẫn|chip|công nghệ|số hóa|phần mềm|apple|google|meta|viễn thông/.test(text)) {
    return "cong-nghe";
  }
  if (/kinh tế|chứng khoán|thị trường|ngân hàng|lãi suất|giá vàng|usd|bất động sản|doanh nghiệp|lạm phát/.test(text)) {
    return "kinh-doanh";
  }
  if (/thế giới|quốc tế|mỹ|trung quốc|nga|ukraine|châu âu|bầu cử|ngoại giao|liên hợp quốc/.test(text)) {
    return "the-gioi";
  }
  if (/pháp luật|môi trường|giao thông|đời sống|văn hóa|thể thao/.test(text)) {
    return "doi-song";
  }
  if (/sức khỏe|y tế|bệnh viện|thuốc|vaccine/.test(text)) {
    return "suc-khoe";
  }
  if (/giáo dục|đại học|học sinh|thi cử/.test(text)) {
    return "giao-duc";
  }
  if (/xe|ô tô|xe điện|vinfast|byd|tesla/.test(text)) {
    return "xe";
  }
  if (/khám phá|khoa học|vũ trụ|thiên văn|khảo cổ|sinh vật|địa chất|thiên nhiên/.test(text)) {
    return "kham-pha";
  }
  return "cong-nghe";
}

export function extractKeywords(title: string, category: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const unique = Array.from(new Set(words)).slice(0, 5);
  return [category, ...unique].join(", ");
}

function composeAiDraft(
  output: EvidenceVerificationOutput,
  rawItem: RawItemRecord,
  source: SourceRecord | undefined,
): DraftContent {
  const title = output.headline?.trim() || fallbackTitle(rawItem, source);
  const parts: string[] = [];

  // Sapo lead paragraph
  parts.push(output.summary);

  // Facts section with H2
  if (output.facts.length > 0) {
    parts.push("## Diễn biến và thông tin trọng tâm");
    for (const fact of output.facts) {
      const refs = fact.sourceRefs.map((ref) => ref.sourceId).join(", ");
      parts.push(`- **Sự thật kiểm chứng:** ${fact.text} *(Nguồn / source: ${refs})*`);
    }
  }

  // Claims section with H2
  if (output.claims.length > 0) {
    parts.push("## Các điểm đang được tiếp tục xác minh");
    for (const claim of output.claims) {
      const refs = claim.sourceRefs.map((ref) => ref.sourceId).join(", ");
      const confidence =
        claim.confidence !== undefined
          ? ` • Độ tin cậy: ${Math.round(claim.confidence * 100)}%`
          : "";
      parts.push(`- ${claim.text} *(Cần xác minh từ: ${refs}${confidence})*`);
    }
  }

  // Attribution
  parts.push("---");
  parts.push(attributionBlock(rawItem, source));

  return { title, body: parts.join("\n\n"), summary: output.summary };
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

  const slug = generateSlug(title);
  const categorySlug = inferCategorySlug(title, draft.body);
  const metaTitle = title.length > 60 ? `${title.slice(0, 57)}…` : title;
  const metaDescription = truncateSummary(draft.summary || title, 160);
  const canonicalUrl = `https://mstudio.minds.io.vn/bai-viet/${slug}`;
  const keywords = extractKeywords(title, categorySlug);

  const article = await createArticle(deps.db, {
    id: crypto.randomUUID(),
    storyId: story.id,
    status: "drafted",
    slug,
    categorySlug,
    metaTitle,
    metaDescription,
    canonicalUrl,
    keywords,
    heroImageUrl: rawItem.imageUrl || undefined,
    sourceCount: 1,
    qualityScore: 88,
    now,
  });

  const revision = await addRevision(
    deps.db,
    {
      id: crypto.randomUUID(),
      articleId: article.id,
      title: draft.title,
      body: draft.body,
      summary: draft.summary,
      now,
    },
    {
      internalLinks: {
        storyId: story.id,
        excludedCategorySlugs: [],
      },
    },
  );

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
