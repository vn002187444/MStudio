import type { D1Database } from "@cloudflare/workers-types";
import type { UserRecord, UserRole } from "@mstudio/contracts";
import { paginate, pageSize } from "./pagination.ts";
import type { PageInput, PagedRows } from "./pagination.ts";

export type { UserRole };

export type UserRow = UserRecord;

export interface NewUser {
  id: string;
  email: string;
  role?: UserRole;
  now?: string;
}

const USER_SELECT = `
  SELECT id, email, role, created_at AS createdAt, updated_at AS updatedAt
  FROM users
`;

export async function createUser(
  db: D1Database,
  input: NewUser,
): Promise<UserRow> {
  const now = input.now ?? new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO users (id, email, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(input.id, input.email, input.role ?? "analyst", now, now)
    .run();
  const row = await getUser(db, input.id);
  if (!row) throw new Error("user not found after insert");
  return row;
}

export async function getUser(
  db: D1Database,
  id: string,
): Promise<UserRow | undefined> {
  const row = await db
    .prepare(`${USER_SELECT} WHERE id = ?`)
    .bind(id)
    .first<UserRow>();
  return row ?? undefined;
}

export async function getUserByEmail(
  db: D1Database,
  email: string,
): Promise<UserRow | undefined> {
  const row = await db
    .prepare(`${USER_SELECT} WHERE email = ?`)
    .bind(email)
    .first<UserRow>();
  return row ?? undefined;
}

export async function listUsers(
  db: D1Database,
  input: PageInput = {},
): Promise<PagedRows<UserRow>> {
  const limit = pageSize(input.limit);
  const results = input.cursor
    ? (
        await db
          .prepare(
            `${USER_SELECT} WHERE (created_at, id) > (?, ?) ORDER BY created_at ASC, id ASC LIMIT ?`,
          )
          .bind(input.cursor.createdAt, input.cursor.id, limit + 1)
          .all<UserRow>()
      ).results
    : (
        await db
          .prepare(`${USER_SELECT} ORDER BY created_at ASC, id ASC LIMIT ?`)
          .bind(limit + 1)
          .all<UserRow>()
      ).results;
  return paginate(results, limit);
}
