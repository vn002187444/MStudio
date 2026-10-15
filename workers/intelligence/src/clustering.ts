import type { RawItemRow } from "@mstudio/db";

export interface ClusterCandidate {
  itemIds: string[];
  signals: string[];
}

export const TITLE_SIMILARITY_THRESHOLD = 0.5;
export const PUBLISHED_WINDOW_MS = 48 * 60 * 60 * 1000;

export function tokenize(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

export function jaccardSimilarity(
  a: Set<string>,
  b: Set<string>,
): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeClusterCandidates(
  items: RawItemRow[],
): ClusterCandidate[] {
  const graph = new ClusterGraph(items.map((item) => item.id));

  const byCanonicalUrl = new Map<string, string[]>();
  for (const item of items) {
    if (item.canonicalUrl === undefined) continue;
    const ids = byCanonicalUrl.get(item.canonicalUrl) ?? [];
    ids.push(item.id);
    byCanonicalUrl.set(item.canonicalUrl, ids);
  }
  for (const ids of byCanonicalUrl.values()) {
    for (let index = 1; index < ids.length; index++) {
      graph.union(ids[0], ids[index], "canonical_url");
    }
  }

  const byPayloadHash = new Map<string, string[]>();
  for (const item of items) {
    const ids = byPayloadHash.get(item.payloadHash) ?? [];
    ids.push(item.id);
    byPayloadHash.set(item.payloadHash, ids);
  }
  for (const ids of byPayloadHash.values()) {
    for (let index = 1; index < ids.length; index++) {
      graph.union(ids[0], ids[index], "payload_hash");
    }
  }

  const tokenizedTitles = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.title !== undefined) {
      tokenizedTitles.set(item.id, tokenize(item.title));
    }
  }

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (titlesMatch(items[i], items[j], tokenizedTitles)) {
        graph.union(items[i].id, items[j].id, "title_similarity");
      }
    }
  }

  return graph.groups().map((group) => ({
    itemIds: group.itemIds,
    signals: group.signals,
  }));
}

function titlesMatch(a: RawItemRow, b: RawItemRow, tokenizedTitles: Map<string, Set<string>>): boolean {
  if (a.title === undefined || b.title === undefined) {
    return false;
  }
  if (
    a.publishedAt === undefined ||
    b.publishedAt === undefined
  ) {
    return false;
  }
  const publishedA = Date.parse(a.publishedAt);
  const publishedB = Date.parse(b.publishedAt);
  if (Number.isNaN(publishedA) || Number.isNaN(publishedB)) {
    return false;
  }
  if (Math.abs(publishedA - publishedB) > PUBLISHED_WINDOW_MS) {
    return false;
  }
  const tokensA = tokenizedTitles.get(a.id);
  const tokensB = tokenizedTitles.get(b.id);
  if (!tokensA || !tokensB) {
    return false;
  }
  return (
    jaccardSimilarity(tokensA, tokensB) >=
    TITLE_SIMILARITY_THRESHOLD
  );
}

class ClusterGraph {
  private parent = new Map<string, string>();
  private signals = new Map<string, Set<string>>();

  constructor(ids: readonly string[]) {
    for (const id of ids) {
      this.parent.set(id, id);
      this.signals.set(id, new Set());
    }
  }

  find(id: string): string {
    const root = this.parent.get(id);
    if (root === undefined || root === id) return id;
    const resolved = this.find(root);
    this.parent.set(id, resolved);
    return resolved;
  }

  union(a: string, b: string, signal: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) {
      this.signals.get(rootA)?.add(signal);
      return;
    }
    this.parent.set(rootB, rootA);
    const merged = new Set([
      ...(this.signals.get(rootA) ?? []),
      ...(this.signals.get(rootB) ?? []),
      signal,
    ]);
    this.signals.set(rootA, merged);
    this.signals.delete(rootB);
  }

  groups(): Array<{ itemIds: string[]; signals: string[] }> {
    const groups = new Map<string, string[]>();
    for (const id of this.parent.keys()) {
      const root = this.find(id);
      const existing = groups.get(root) ?? [];
      existing.push(id);
      groups.set(root, existing);
    }
    return [...groups.entries()]
      .filter(([, ids]) => ids.length >= 2)
      .map(([root, ids]) => ({
        itemIds: ids,
        signals: [...(this.signals.get(root) ?? [])],
      }));
  }
}
