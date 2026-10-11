import { z } from "zod";

/**
 * Shared FE validation (FU-16) — cùng triết lý Zod với workers/api.
 * Server-safe: dùng cho searchParams và route params trước khi render/fetch.
 */

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Nhập từ khóa để tìm kiếm.")
  .max(200, "Từ khóa tối đa 200 ký tự.");

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và gạch ngang.");

export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export function parseSearchQuery(raw: unknown): string | undefined {
  const result = searchQuerySchema.safeParse(raw);
  return result.success ? result.data : undefined;
}
