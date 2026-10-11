import { z } from "zod";

/**
 * Studio editor validation (FU-16) — cùng triết lý Zod với workers/api.
 * Client-safe: chạy trong interaction handlers trước khi setState/submit.
 */

export const headlineSchema = z
  .string()
  .trim()
  .min(1, "Headline không được để trống.")
  .max(200, "Headline tối đa 200 ký tự.");

export const dekSchema = z
  .string()
  .trim()
  .max(500, "Dek tối đa 500 ký tự.");

export const editorSlugSchema = z
  .string()
  .trim()
  .min(1, "Slug không được để trống.")
  .max(120, "Slug tối đa 120 ký tự.")
  .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và gạch ngang.");

export const sourceUrlSchema = z
  .string()
  .trim()
  .min(1, "URL nguồn không được để trống.")
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    "URL nguồn phải là http(s) hợp lệ.",
  );

export function firstError(
  result: { success: boolean; error?: { issues: Array<{ message: string }> } },
): string | undefined {
  if (result.success || !result.error) return undefined;
  return result.error.issues[0]?.message;
}
