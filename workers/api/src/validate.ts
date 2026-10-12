import { z } from "zod";
import type {
  AllowStatus,
  CreateFeedRequest,
  CreateSourceRequest,
  FeedFormat,
  PageInput,
  RawItemStatus,
  ReaderEventInput,
  SourceKind,
  UpdateArticleRequest,
  UpdateFeedRequest,
  UpdateSourceAllowStatusRequest,
} from "@mstudio/contracts";

export type ValidationErrors = Record<string, string[]>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationErrors };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pushError(
  errors: ValidationErrors,
  field: string,
  message: string,
): void {
  const existing = errors[field] ?? [];
  existing.push(message);
  errors[field] = existing;
}

const SOURCE_KINDS = [
  "rss",
  "sitemap",
  "api",
  "manual",
] as const;
const FEED_FORMATS = [
  "rss",
  "atom",
  "jsonfeed",
  "sitemap",
] as const;
const ALLOW_STATUSES = [
  "approved",
  "denied",
  "pending",
] as const;
const RAW_ITEM_STATUSES = [
  "incoming",
  "normalized",
  "clustered",
  "discarded",
] as const;
const RIGHTS_STATUSES = ["clear", "licensed", "unknown"] as const;

function mapZodError(error: z.ZodError): ValidationErrors {
  const errs: ValidationErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const p = path === "" ? "body" : path;
    if (!errs[p]) {
      errs[p] = [];
    }
    errs[p].push(issue.message);
  }
  return errs;
}

const createSourceSchema = z.object({
  name: z.string({ message: "required non-empty string" }).trim().min(1, "required non-empty string").max(200, "must be at most 200 characters"),
  originUrl: z.string({ message: "required http(s) URL" }).refine((val) => {
    try {
      const u = new URL(val);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }, "required http(s) URL"),
  kind: z.enum(SOURCE_KINDS, { message: `required one of: ${SOURCE_KINDS.join(", ")}` }),
  rightsStatus: z.enum(RIGHTS_STATUSES, { message: "optional one of: clear, licensed, unknown" }).optional(),
  allowStatus: z.enum(ALLOW_STATUSES, { message: `optional one of: ${ALLOW_STATUSES.join(", ")}` }).optional()
}).strict();

export function validateCreateSource(
  body: unknown,
): ValidationResult<CreateSourceRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }

  const result = createSourceSchema.safeParse(body);

  if (!result.success) {
    return { ok: false, errors: mapZodError(result.error) };
  }

  return { ok: true, value: result.data as CreateSourceRequest };
}

const createFeedSchema = z.object({
  url: z.string({ message: "required http(s) URL" }).refine((val) => {
    try {
      const u = new URL(val);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  }, "required http(s) URL"),
  format: z.enum(FEED_FORMATS, { message: `required one of: ${FEED_FORMATS.join(", ")}` }),
  fetchIntervalSeconds: z.number({ message: "optional integer between 60 and 86400" })
    .int("optional integer between 60 and 86400")
    .min(60, "optional integer between 60 and 86400")
    .max(86400, "optional integer between 60 and 86400")
    .optional(),
});

export function validateCreateFeed(
  body: unknown,
): ValidationResult<CreateFeedRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }

  const result = createFeedSchema.safeParse(body);
  if (!result.success) {
    return { ok: false, errors: mapZodError(result.error) };
  }
  return { ok: true, value: result.data as CreateFeedRequest };
}

const updateSourceAllowStatusSchema = z.object({
  allowStatus: z.enum(ALLOW_STATUSES, { message: `required one of: ${ALLOW_STATUSES.join(", ")}` }),
});

export function validateUpdateSourceAllowStatus(
  body: unknown,
): ValidationResult<UpdateSourceAllowStatusRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  const result = updateSourceAllowStatusSchema.safeParse(body);
  if (!result.success) {
    return { ok: false, errors: mapZodError(result.error) };
  }
  return { ok: true, value: result.data as UpdateSourceAllowStatusRequest };
}

const updateFeedSchema = z.object({
  enabled: z.boolean({ message: "required boolean" }),
});

export function validateUpdateFeed(
  body: unknown,
): ValidationResult<UpdateFeedRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  const result = updateFeedSchema.safeParse(body);
  if (!result.success) {
    return { ok: false, errors: mapZodError(result.error) };
  }
  return { ok: true, value: result.data as UpdateFeedRequest };
}

export function validatePagination(
  params: URLSearchParams,
): ValidationResult<PageInput> {
  const errors: ValidationErrors = {};
  const limitParam = params.get("limit");
  let limit: number | undefined;
  if (limitParam !== null) {
    const parsed = Number(limitParam);
    if (
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      parsed > 100
    ) {
      errors["limit"] = ["integer between 1 and 100"];
    } else {
      limit = parsed;
    }
  }
  const cursorCreatedAt = params.get("cursor_created_at");
  const cursorId = params.get("cursor_id");
  let cursor: PageInput["cursor"];
  if (cursorCreatedAt !== null || cursorId !== null) {
    if (cursorCreatedAt === null || cursorId === null) {
      errors["cursor"] = ["cursor_created_at and cursor_id must be provided together"];
    } else {
      cursor = { createdAt: cursorCreatedAt, id: cursorId };
    }
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { limit, cursor } };
}

export interface RecommendationsQuery {
  userId?: string;
  articleId?: string;
  limit?: number;
}

export function validateRecommendationsQuery(
  params: URLSearchParams,
): ValidationResult<RecommendationsQuery> {
  const errors: ValidationErrors = {};
  const userId = params.get("userId");
  if (userId !== null && !isNonEmptyString(userId)) {
    pushError(errors, "userId", "must be a non-empty string");
  }
  const articleId = params.get("articleId");
  if (articleId !== null && !isNonEmptyString(articleId)) {
    pushError(errors, "articleId", "must be a non-empty string");
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  const pagination = validatePagination(params);
  if (!pagination.ok) {
    return { ok: false, errors: pagination.errors };
  }
  return {
    ok: true,
    value: {
      userId: userId ?? undefined,
      articleId: articleId ?? undefined,
      limit: pagination.value.limit,
    },
  };
}

export function validateRawItemStatus(
  status: string | null,
): ValidationResult<RawItemStatus> {
  const value = status ?? "incoming";
  const result = z.enum(RAW_ITEM_STATUSES, { message: `must be one of: ${RAW_ITEM_STATUSES.join(", ")}` }).safeParse(value);
  if (!result.success) {
    return {
      ok: false,
      errors: {
        status: [`must be one of: ${RAW_ITEM_STATUSES.join(", ")}`],
      },
    };
  }
  return { ok: true, value: result.data as RawItemStatus };
}

const MAX_READER_EVENTS = 100;

function hasEventTarget(event: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(event.articleId) ||
    isNonEmptyString(event.topicId) ||
    isNonEmptyString(event.url)
  );
}

function validateReaderEvent(
  event: unknown,
): ValidationResult<ReaderEventInput> {
  const errors: ValidationErrors = {};
  if (!isRecord(event)) {
    return { ok: false, errors: { event: ["must be an object"] } };
  }
  if (!isNonEmptyString(event.eventType)) {
    pushError(errors, "eventType", "must be a non-empty string");
  }
  if (!hasEventTarget(event)) {
    pushError(
      errors,
      "target",
      "must provide articleId, topicId, or url",
    );
  }
  if (event.userId !== undefined && !isNonEmptyString(event.userId)) {
    pushError(errors, "userId", "must be a non-empty string when provided");
  }
  for (const field of ["articleId", "topicId", "url"] as const) {
    if (event[field] !== undefined && !isNonEmptyString(event[field])) {
      pushError(errors, field, "must be a non-empty string when provided");
    }
  }
  if (
    event.occurredAt !== undefined &&
    !isNonEmptyString(event.occurredAt)
  ) {
    pushError(errors, "occurredAt", "must be a non-empty string when provided");
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: event as unknown as ReaderEventInput };
}

export function validateReaderEvents(
  body: unknown,
): ValidationResult<ReaderEventInput[]> {
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: { body: ["must be an object with an events array"] },
    };
  }
  const events = body.events;
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, errors: { events: ["must be a non-empty array"] } };
  }
  const errors: ValidationErrors = {};
  const parsed: ReaderEventInput[] = [];
  events.forEach((event, index) => {
    const validation = validateReaderEvent(event);
    if (validation.ok) {
      parsed.push(validation.value);
    } else {
      for (const [field, messages] of Object.entries(validation.errors)) {
        errors[`events[${index}].${field}`] = messages;
      }
    }
  });
  if (events.length > MAX_READER_EVENTS) {
    pushError(
      errors,
      "events",
      `must contain at most ${MAX_READER_EVENTS} events`,
    );
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: parsed };
}

const optionalHttpUrl = z
  .string()
  .refine((val) => {
    if (!val || val.trim() === "") return true;
    try {
      const u = new URL(val);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "must be a valid http(s) URL")
  .optional();

const updateArticleSchema = z.object({
  slug: z.string().trim().min(1).optional(),
  categorySlug: z.string().trim().min(1).optional(),
  heroImageUrl: optionalHttpUrl,
  videoUrl: optionalHttpUrl,
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  canonicalUrl: optionalHttpUrl,
  ogImageUrl: optionalHttpUrl,
  keywords: z.string().trim().optional(),
  isBreaking: z.boolean().optional(),
  isTrending: z.boolean().optional(),
}).strict();

export function validateUpdateArticle(
  body: unknown,
): ValidationResult<UpdateArticleRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  const result = updateArticleSchema.safeParse(body);
  if (!result.success) {
    return { ok: false, errors: mapZodError(result.error) };
  }
  return { ok: true, value: result.data as UpdateArticleRequest };
}

