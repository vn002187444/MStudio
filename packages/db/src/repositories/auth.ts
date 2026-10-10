export type Role = "admin" | "editor" | "reviewer" | "seo" | "analyst";

const ROLES: readonly Role[] = [
  "admin",
  "editor",
  "reviewer",
  "seo",
  "analyst",
];

export interface SessionRecord {
  tokenHash: string;
  userId: string;
  role: Role;
  expiresAt: string;
}

interface SessionRowRaw {
  token_hash: string;
  user_id: string;
  role: Role;
  expires_at: string;
}

export interface SessionIdentity {
  userId: string;
  role: Role;
}

export interface AuditLogRecord {
  actor: string;
  action: string;
  target?: string;
  at: string;
}

export interface CreateSessionInput {
  userId: string;
  role: Role;
  expiresAt: string;
}

export interface RecordAuditInput {
  actor: string;
  action: string;
  target?: string;
  at: string;
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function toSessionRecord(row: SessionRowRaw): SessionRecord {
  return {
    tokenHash: row.token_hash,
    userId: row.user_id,
    role: row.role,
    expiresAt: row.expires_at,
  };
}

export async function createSession(
  db: D1Database,
  input: CreateSessionInput,
): Promise<{ token: string; session: SessionRecord }> {
  if (!ROLES.includes(input.role)) {
    throw new Error(`invalid role: ${input.role}`);
  }
  const token = generateToken();
  const tokenHash = await hashToken(token);
  await db
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, role, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(tokenHash, input.userId, input.role, input.expiresAt)
    .run();
  return {
    token,
    session: {
      tokenHash,
      userId: input.userId,
      role: input.role,
      expiresAt: input.expiresAt,
    },
  };
}

export async function verifySession(
  db: D1Database,
  token: string,
  now: string = new Date().toISOString(),
): Promise<SessionIdentity | undefined> {
  const tokenHash = await hashToken(token);
  const row = await db
    .prepare(
      `SELECT user_id AS userId, role AS role
       FROM sessions
       WHERE token_hash = ? AND expires_at > ?`,
    )
    .bind(tokenHash, now)
    .first<{ userId: string; role: Role }>();
  return row ?? undefined;
}

export async function recordAudit(
  db: D1Database,
  input: RecordAuditInput,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_log (actor, action, target, at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(input.actor, input.action, input.target ?? null, input.at)
    .run();
}

export async function listAuditLog(
  db: D1Database,
  limit: number = 100,
): Promise<AuditLogRecord[]> {
  const rows = await db
    .prepare(
      `SELECT actor AS actor, action AS action, target AS target, at AS at
       FROM audit_log
       ORDER BY rowid DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<AuditLogRecord>();
  return rows.results.map((row) => ({
    ...row,
    target: row.target ?? undefined,
  }));
}

export async function checkRateLimit(
  db: D1Database,
  ip: string,
  window: string,
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (ip, window, count) VALUES (?, ?, 1)
       ON CONFLICT (ip, window) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(ip, window)
    .first<{ count: number }>();
  const count = row?.count ?? 1;
  return { allowed: count <= limit, count };
}
