import type { D1Database } from "@cloudflare/workers-types";
import type { EmailRecord } from "@mstudio/contracts";

export async function createEmail(
  db: D1Database,
  email: EmailRecord,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO emails (id, direction, sender_name, sender_email, recipient_email, subject, body, preview, category, status, starred, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      email.id,
      email.direction,
      email.senderName || null,
      email.senderEmail,
      email.recipientEmail,
      email.subject,
      email.body,
      email.preview || null,
      email.category,
      email.status,
      email.starred,
      email.createdAt,
    )
    .run();
}

export async function listEmails(
  db: D1Database,
  options?: { category?: string; status?: string; limit?: number },
): Promise<EmailRecord[]> {
  const limit = options?.limit ?? 50;
  let query = `SELECT id, direction, sender_name as senderName, sender_email as senderEmail, recipient_email as recipientEmail, subject, body, preview, category, status, starred, created_at as createdAt FROM emails WHERE 1=1`;
  const binds: any[] = [];

  if (options?.category) {
    query += ` AND category = ?`;
    binds.push(options.category);
  }
  if (options?.status) {
    query += ` AND status = ?`;
    binds.push(options.status);
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  binds.push(limit);

  const { results } = await db.prepare(query).bind(...binds).all<EmailRecord>();
  return results ?? [];
}

export async function updateEmailStatus(
  db: D1Database,
  id: string,
  status: string,
): Promise<void> {
  await db
    .prepare(`UPDATE emails SET status = ? WHERE id = ?`)
    .bind(status, id)
    .run();
}

export async function updateEmailStar(
  db: D1Database,
  id: string,
  starred: number,
): Promise<void> {
  await db
    .prepare(`UPDATE emails SET starred = ? WHERE id = ?`)
    .bind(starred, id)
    .run();
}
