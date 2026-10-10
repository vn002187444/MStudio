import {
  checkRateLimit,
  recordAudit,
  verifySession,
  type Role,
  type SessionIdentity,
} from "@mstudio/db";
import type {
  Context,
  MiddlewareHandler,
  Next,
} from "hono";
import type { AppEnv } from "./index.ts";

export async function verifyBearer(
  authorization: string | null,
  db: D1Database,
): Promise<SessionIdentity | undefined> {
  if (!authorization) {
    return undefined;
  }
  const [scheme, token, ...rest] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    return undefined;
  }
  return verifySession(db, token);
}

export function requireRole(...roles: Role[]): MiddlewareHandler<AppEnv> {
  return async (
    c: Context<AppEnv>,
    next: Next,
  ): Promise<Response | void> => {
    const identity = await verifyBearer(
      c.req.raw.headers.get("authorization"),
      c.env.DB,
    );
    if (!identity) {
      return c.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "bearer token required",
          },
        },
        401,
      );
    }
    if (!roles.includes(identity.role)) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `requires role: ${roles.join(", ")}`,
          },
        },
        403,
      );
    }
    c.set("session", identity);
    await next();
  };
}

export interface RateLimitOptions {
  limit?: number;
  clock?: () => number;
}

export const DEFAULT_WRITE_RATE_LIMIT = 60;

export function minuteWindow(now: number): string {
  return Math.floor(now / 60_000).toString();
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

export function rateLimit(
  options: RateLimitOptions = {},
): MiddlewareHandler<AppEnv> {
  const limit = options.limit ?? DEFAULT_WRITE_RATE_LIMIT;
  const clock = options.clock ?? (() => Date.now());
  return async (
    c: Context<AppEnv>,
    next: Next,
  ): Promise<Response | void> => {
    const ip = clientIp(c.req.raw);
    const window = minuteWindow(clock());
    const { allowed } = await checkRateLimit(
      c.env.DB,
      ip,
      window,
      limit,
    );
    if (!allowed) {
      return c.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "too many requests, retry later",
          },
        },
        429,
      );
    }
    await next();
  };
}

export function auditChanges(action: string): MiddlewareHandler<AppEnv> {
  return async (
    c: Context<AppEnv>,
    next: Next,
  ): Promise<Response | void> => {
    await next();
    const session = c.get("session");
    if (!session || c.res.status >= 400) {
      return;
    }
    try {
      await recordAudit(c.env.DB, {
        actor: session.userId,
        action,
        target: c.req.param("id"),
        at: new Date().toISOString(),
      });
    } catch {
      c.get("logger")?.error("audit_log_failed", { action });
    }
  };
}
