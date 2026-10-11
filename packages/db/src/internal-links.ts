import type { D1Database } from "@cloudflare/workers-types";
import type { EntityKind } from "@mstudio/contracts";
import { listStoryEntities } from "./repositories/entities.ts";

export const MAX_INTERNAL_LINKS = 3;

const ENTITY_ROUTE: Record<EntityKind, string> = {
  person: "nhan-vat",
  organization: "to-chuc",
  location: "quoc-gia",
  event: "chu-de",
  concept: "chu-de",
  other: "chu-de",
};

export interface InternalLinkCandidate {
  entityId: string;
  name: string;
  target: string;
}

export interface InternalLinkOptions {
  maxLinks?: number;
  excludedCategorySlugs?: readonly string[];
  articleCategorySlug?: string;
}

function toAsciiSlug(name: string): string | undefined {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || undefined;
}

/**
 * Resolves linkable entities for a story: reads story_entities,
 * joins entity names/kinds, maps each kind to its web route
 * (/nhan-vat|to-chuc|quoc-gia|chu-de/{slug}). Only ASCII-safe
 * slugs produce targets — anything else is skipped, never
 * fabricated.
 */
export async function resolveLinkCandidates(
  db: D1Database,
  storyId: string,
): Promise<InternalLinkCandidate[]> {
  const links = await listStoryEntities(db, storyId);
  if (links.length === 0) {
    return [];
  }
  const ids = [...new Set(links.map((link) => link.entityId))];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = (
    await db
      .prepare(
        `SELECT id, name, kind FROM entities WHERE id IN (${placeholders})`,
      )
      .bind(...ids)
      .all<{ id: string; name: string; kind: EntityKind }>()
  ).results;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const candidates: InternalLinkCandidate[] = [];
  const seenTargets = new Set<string>();
  for (const link of links) {
    const entity = byId.get(link.entityId);
    if (!entity) {
      continue;
    }
    const slug = toAsciiSlug(entity.name);
    if (!slug) {
      continue;
    }
    const target = `/${ENTITY_ROUTE[entity.kind]}/${slug}`;
    if (seenTargets.has(target)) {
      continue;
    }
    seenTargets.add(target);
    candidates.push({
      entityId: entity.id,
      name: entity.name,
      target,
    });
  }
  return candidates;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Inserts up to maxLinks contextual anchors into a revision body.
 * First plain-text occurrence of each entity name becomes
 * [name](target); existing markdown links, headings and duplicate
 * targets are left untouched (no stuffing). Category-excluded
 * articles (e.g. "Goc Toi" slugs supplied later by Human) get
 * the body back unchanged.
 */
export function applyInternalLinks(
  body: string,
  candidates: readonly InternalLinkCandidate[],
  options: InternalLinkOptions = {},
): string {
  const {
    maxLinks = MAX_INTERNAL_LINKS,
    excludedCategorySlugs = [],
    articleCategorySlug,
  } = options;
  if (
    articleCategorySlug &&
    excludedCategorySlugs.includes(articleCategorySlug)
  ) {
    return body;
  }
  let result = body;
  let inserted = 0;
  const usedTargets = new Set<string>();
  for (const candidate of candidates) {
    if (inserted >= maxLinks) {
      break;
    }
    if (usedTargets.has(candidate.target)) {
      continue;
    }
    const pattern = new RegExp(
      `(?<![\\[\\]/\\w-])${escapeRegExp(candidate.name)}(?![\\]\\w-])`,
    );
    const match = pattern.exec(result);
    if (!match || match.index === undefined) {
      continue;
    }
    const lineStart = result.lastIndexOf("\n", match.index) + 1;
    const lineEnd = result.indexOf("\n", match.index);
    const line = result.slice(
      lineStart,
      lineEnd === -1 ? undefined : lineEnd,
    );
    if (/^\s*#{1,6}\s/.test(line)) {
      continue;
    }
    result =
      result.slice(0, match.index) +
      `[${candidate.name}](${candidate.target})` +
      result.slice(match.index + candidate.name.length);
    usedTargets.add(candidate.target);
    inserted += 1;
  }
  return result;
}
