import { z } from "zod";
import type {
  AllowStatus,
  CreateFeedRequest,
  CreateSourceRequest,
  FeedFormat,
  PageInput,
  RawItemStatus,
  SourceKind,
  UpdateFeedRequest,
  UpdateSourceAllowStatusRequest,
} from "@mstudio/contracts";

export type ValidationErrors = Record<string, string[]>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationErrors };

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
