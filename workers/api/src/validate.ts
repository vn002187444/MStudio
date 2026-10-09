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

const SOURCE_KINDS: readonly SourceKind[] = [
  "rss",
  "sitemap",
  "api",
  "manual",
];
const FEED_FORMATS: readonly FeedFormat[] = [
  "rss",
  "atom",
  "jsonfeed",
  "sitemap",
];
const ALLOW_STATUSES: readonly AllowStatus[] = [
  "approved",
  "denied",
  "pending",
];
const RAW_ITEM_STATUSES: readonly RawItemStatus[] = [
  "incoming",
  "normalized",
  "clustered",
  "discarded",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnumMember<T extends string>(
  value: unknown,
  members: readonly T[],
): value is T {
  return typeof value === "string" && members.includes(value as T);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
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

export function validateCreateSource(
  body: unknown,
): ValidationResult<CreateSourceRequest> {
  const errors: ValidationErrors = {};
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  if (!isNonEmptyString(body.name)) {
    pushError(errors, "name", "required non-empty string");
  } else if (body.name.length > 200) {
    pushError(errors, "name", "must be at most 200 characters");
  }
  if (!isHttpUrl(body.originUrl)) {
    pushError(errors, "originUrl", "required http(s) URL");
  }
  if (!isEnumMember(body.kind, SOURCE_KINDS)) {
    pushError(
      errors,
      "kind",
      `required one of: ${SOURCE_KINDS.join(", ")}`,
    );
  }
  if (
    body.rightsStatus !== undefined &&
    !isEnumMember(body.rightsStatus, ["clear", "licensed", "unknown"] as const)
  ) {
    pushError(
      errors,
      "rightsStatus",
      "optional one of: clear, licensed, unknown",
    );
  }
  if (
    body.allowStatus !== undefined &&
    !isEnumMember(body.allowStatus, ALLOW_STATUSES)
  ) {
    pushError(
      errors,
      "allowStatus",
      `optional one of: ${ALLOW_STATUSES.join(", ")}`,
    );
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      name: body.name as string,
      originUrl: body.originUrl as string,
      kind: body.kind as SourceKind,
      rightsStatus: body.rightsStatus as
        | CreateSourceRequest["rightsStatus"]
        | undefined,
      allowStatus: body.allowStatus as
        | CreateSourceRequest["allowStatus"]
        | undefined,
    },
  };
}

export function validateCreateFeed(
  body: unknown,
): ValidationResult<CreateFeedRequest> {
  const errors: ValidationErrors = {};
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  if (!isHttpUrl(body.url)) {
    pushError(errors, "url", "required http(s) URL");
  }
  if (!isEnumMember(body.format, FEED_FORMATS)) {
    pushError(
      errors,
      "format",
      `required one of: ${FEED_FORMATS.join(", ")}`,
    );
  }
  if (
    body.fetchIntervalSeconds !== undefined &&
    (typeof body.fetchIntervalSeconds !== "number" ||
      !Number.isInteger(body.fetchIntervalSeconds) ||
      body.fetchIntervalSeconds < 60 ||
      body.fetchIntervalSeconds > 86400)
  ) {
    pushError(
      errors,
      "fetchIntervalSeconds",
      "optional integer between 60 and 86400",
    );
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      url: body.url as string,
      format: body.format as FeedFormat,
      fetchIntervalSeconds: body.fetchIntervalSeconds as
        | number
        | undefined,
    },
  };
}

export function validateUpdateSourceAllowStatus(
  body: unknown,
): ValidationResult<UpdateSourceAllowStatusRequest> {
  const errors: ValidationErrors = {};
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  if (!isEnumMember(body.allowStatus, ALLOW_STATUSES)) {
    pushError(
      errors,
      "allowStatus",
      `required one of: ${ALLOW_STATUSES.join(", ")}`,
    );
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: { allowStatus: body.allowStatus as AllowStatus },
  };
}

export function validateUpdateFeed(
  body: unknown,
): ValidationResult<UpdateFeedRequest> {
  const errors: ValidationErrors = {};
  if (!isRecord(body)) {
    return {
      ok: false,
      errors: { body: ["expected a JSON object"] },
    };
  }
  if (typeof body.enabled !== "boolean") {
    pushError(errors, "enabled", "required boolean");
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, value: { enabled: body.enabled as boolean } };
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
      pushError(errors, "limit", "integer between 1 and 100");
    } else {
      limit = parsed;
    }
  }
  const cursorCreatedAt = params.get("cursor_created_at");
  const cursorId = params.get("cursor_id");
  let cursor: PageInput["cursor"];
  if (cursorCreatedAt !== null || cursorId !== null) {
    if (cursorCreatedAt === null || cursorId === null) {
      pushError(
        errors,
        "cursor",
        "cursor_created_at and cursor_id must be provided together",
      );
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
  if (!isEnumMember(value, RAW_ITEM_STATUSES)) {
    return {
      ok: false,
      errors: {
        status: [`must be one of: ${RAW_ITEM_STATUSES.join(", ")}`],
      },
    };
  }
  return { ok: true, value };
}
