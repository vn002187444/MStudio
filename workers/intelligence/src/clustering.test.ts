import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { Logger } from "@mstudio/observability";
import {
  createFeed,
  createRawItem,
  createSource,
} from "@mstudio/db";
import { openMigratedTestDb } from "@mstudio/db/testing";
import {
  computeClusterCandidates,
  jaccardSimilarity,
  tokenize,
  TITLE_SIMILARITY_THRESHOLD,
} from "./clustering.ts";
import { runClusteringStage } from "./index.ts";

const NOW = "2026-01-05T00:00:00.000Z";
const LATER = "2026-01-06T00:00:00.000Z";
const FAR_LATER = "2026-01-20T00:00:00.000Z";

interface CapturedLog {
  message: string;
  data: Record<string, unknown>;
}

interface CapturingLogger extends Logger {
  logs: CapturedLog[];
}

function capturingLogger(): CapturingLogger {
  const logs: CapturedLog[] = [];
  const handler = (
    message: string,
    data?: Record<string, unknown>,
  ) => {
    logs.push({ message, data: data ?? {} });
  };
  return {
    debug: handler,
    info: handler,
    warn: handler,
    error: handler,
    logs,
  };
}

function item(
  id: string,
  options: {
    canonicalUrl?: string;
    title?: string;
    publishedAt?: string;
    payloadHash?: string;
  } = {},
) {
  return {
    id,
    feedId: `feed-${id}`,
    sourceId: `source-${id}`,
    externalId: `ext-${id}`,
    url: `https://example.com/${id}`,
    canonicalUrl: options.canonicalUrl,
    title: options.title,
    publishedAt: options.publishedAt,
    fetchedAt: NOW,
    payloadHash: options.payloadHash ?? `hash-${id}`,
    status: "incoming" as const,
    createdAt: NOW,
  };
}

test("tokenize lowercases, strips punctuation and drops short tokens", async () => {
  const tokens = tokenize("Breaking: AI Rally, Today!");
  assert.deepEqual([...tokens].sort(), [
    "breaking",
    "rally",
    "today",
  ]);
});

test("jaccard similarity is 1 for identical and 0 for disjoint sets", async () => {
  const a = tokenize("Market Rally Today");
  const b = tokenize("Market Rally Today");
  const c = tokenize("Sports Final Score");
  assert.equal(jaccardSimilarity(a, b), 1);
  assert.equal(jaccardSimilarity(a, c), 0);
  const d = tokenize("Market Rally Tonight");
  const similarity = jaccardSimilarity(a, d);
  assert.ok(
    similarity > 0 && similarity < 1,
    `expected partial similarity, got ${similarity}`,
  );
});

test("clusters items sharing a canonical url", async () => {
  const items = [
    item("a", { canonicalUrl: "https://example.com/story" }),
    item("b", { canonicalUrl: "https://example.com/story" }),
    item("c", { canonicalUrl: "https://example.com/other" }),
  ];
  const candidates = computeClusterCandidates(items);
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].itemIds, ["a", "b"]);
  assert.deepEqual(candidates[0].signals, ["canonical_url"]);
});

test("clusters items sharing a payload hash", async () => {
  const items = [
    item("a", { payloadHash: "shared-hash" }),
    item("b", { payloadHash: "shared-hash" }),
    item("c", { payloadHash: "unique-hash" }),
  ];
  const candidates = computeClusterCandidates(items);
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].itemIds, ["a", "b"]);
  assert.deepEqual(candidates[0].signals, ["payload_hash"]);
});

test("clusters similar titles published within the window", async () => {
  const items = [
    item("a", {
      title: "Breaking: Market Rally Today",
      publishedAt: NOW,
    }),
    item("b", {
      title: "Breaking: Market Rally Tonight",
      publishedAt: LATER,
    }),
  ];
  const candidates = computeClusterCandidates(items);
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].itemIds, ["a", "b"]);
  assert.deepEqual(candidates[0].signals, ["title_similarity"]);
});

test("does not cluster dissimilar titles", async () => {
  const items = [
    item("a", {
      title: "Market Rally Today",
      publishedAt: NOW,
    }),
    item("b", {
      title: "Sports Final Score",
      publishedAt: NOW,
    }),
  ];
  assert.equal(computeClusterCandidates(items).length, 0);
});

test("does not cluster similar titles beyond the window", async () => {
  const items = [
    item("a", {
      title: "Breaking: Market Rally Today",
      publishedAt: NOW,
    }),
    item("b", {
      title: "Breaking: Market Rally Tonight",
      publishedAt: FAR_LATER,
    }),
  ];
  assert.equal(computeClusterCandidates(items).length, 0);
});

test("title signal requires titles and dates on both items", async () => {
  const missingTitle = [
    item("a", { title: "Market Rally Today", publishedAt: NOW }),
    item("b", { publishedAt: NOW }),
  ];
  assert.equal(computeClusterCandidates(missingTitle).length, 0);
  const missingDate = [
    item("a", { title: "Market Rally Today" }),
    item("b", { title: "Market Rally Tonight" }),
  ];
  assert.equal(computeClusterCandidates(missingDate).length, 0);
});

test("merges transitively linked items into one candidate", async () => {
  const items = [
    item("a", { canonicalUrl: "https://example.com/story" }),
    item("b", {
      canonicalUrl: "https://example.com/story",
      title: "Breaking: Market Rally Today",
      publishedAt: NOW,
    }),
    item("c", {
      title: "Breaking: Market Rally Tonight",
      publishedAt: NOW,
    }),
  ];
  const candidates = computeClusterCandidates(items);
  assert.equal(candidates.length, 1);
  assert.deepEqual(
    [...candidates[0].itemIds].sort(),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    [...candidates[0].signals].sort(),
    ["canonical_url", "title_similarity"],
  );
});

test("skips singleton items", async () => {
  const candidates = computeClusterCandidates([
    item("a"),
    item("b", { title: "Unrelated Topic", publishedAt: NOW }),
  ]);
  assert.equal(candidates.length, 0);
});

test("similarity threshold boundary is inclusive", async () => {
  const a = tokenize("alpha beta gamma");
  const b = tokenize("alpha beta delta");
  assert.equal(jaccardSimilarity(a, b), 0.5);
  const items = [
    item("a", {
      title: "Alpha Beta Gamma",
      publishedAt: NOW,
    }),
    item("b", {
      title: "Alpha Beta Delta",
      publishedAt: NOW,
    }),
  ];
  const candidates = computeClusterCandidates(items);
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].itemIds, ["a", "b"]);
});

async function setup(
  featureEnv: Record<string, string> = {},
): Promise<{
  env: Env;
  db: D1Database;
  close(): void;
  logger: CapturingLogger;
}> {
  const { db, close } = await openMigratedTestDb();
  const logger = capturingLogger();
  const env = {
    DB: db,
    ENVIRONMENT: "test",
    LOG_LEVEL: "error",
    ...featureEnv,
  } as unknown as Env;
  return { env, db, close, logger };
}

async function seedItem(
  db: D1Database,
  suffix: string,
  options: {
    canonicalUrl?: string;
    title?: string;
    publishedAt?: string;
    payloadHash?: string;
  },
): Promise<void> {
  const sourceId = `source-${suffix}`;
  const feedId = `feed-${suffix}`;
  await createSource(db, {
    id: sourceId,
    name: `Source ${suffix}`,
    originUrl: `https://${suffix}.example.com`,
    kind: "rss",
    now: NOW,
  });
  await createFeed(db, {
    id: feedId,
    sourceId,
    url: `https://${suffix}.example.com/feed.xml`,
    format: "rss",
    now: NOW,
  });
  await createRawItem(db, {
    id: `item-${suffix}`,
    feedId,
    sourceId,
    externalId: `ext-${suffix}`,
    url: `https://${suffix}.example.com/story`,
    canonicalUrl: options.canonicalUrl,
    title: options.title,
    publishedAt: options.publishedAt,
    fetchedAt: NOW,
    payloadHash: options.payloadHash ?? `hash-${suffix}`,
  });
}

test("clustering stage scans incoming items and logs candidates", async () => {
  const { env, db, close, logger } = await setup();
  try {
    await seedItem(db, "a", {
      canonicalUrl: "https://example.com/story",
    });
    await seedItem(db, "b", {
      canonicalUrl: "https://example.com/story",
    });
    await seedItem(db, "c", {
      title: "Unrelated Topic",
      publishedAt: NOW,
    });
    const result = await runClusteringStage(env, logger);
    assert.deepEqual(result, {
      itemsScanned: 3,
      candidates: 1,
      clusteredItems: 2,
      vectorizeEnabled: false,
    });
    const candidateLogs = logger.logs.filter(
      (entry) => entry.message === "cluster_candidate",
    );
    assert.equal(candidateLogs.length, 1);
    assert.deepEqual(candidateLogs[0].data.itemIds, [
      "item-a",
      "item-b",
    ]);
    assert.deepEqual(candidateLogs[0].data.signals, [
      "canonical_url",
    ]);
  } finally {
    close();
  }
});

test("vectorize kill switch is off by default and opt-in", async () => {
  const { env, db, close, logger } = await setup({
    FEATURE_VECTORIZE_ENABLED: "true",
  });
  try {
    await seedItem(db, "a", {
      title: "Solo Story",
      publishedAt: NOW,
    });
    const result = await runClusteringStage(env, logger);
    assert.equal(result.vectorizeEnabled, true);
    const vectorizeLogs = logger.logs.filter(
      (entry) => entry.message === "vectorize_path_enabled",
    );
    assert.equal(vectorizeLogs.length, 1);
  } finally {
    close();
  }
});

test("clustering stage paginates across pages", async () => {
  const { env, db, close, logger } = await setup();
  try {
    const words = ["alpha", "beta", "gamma", "delta", "epsilon"];
    const suffixes = ["p1", "p2", "p3", "p4", "p5"];
    for (const [index, suffix] of suffixes.entries()) {
      await seedItem(db, suffix, {
        title: `${words[index]} headline`,
        publishedAt: NOW,
      });
    }
    const result = await runClusteringStage(env, logger, {
      pageSize: 2,
    });
    assert.equal(result.itemsScanned, 5);
    assert.equal(result.candidates, 0);
    const complete = logger.logs.find(
      (entry) => entry.message === "clustering_stage_complete",
    );
    assert.equal(complete?.data.itemsScanned, 5);
  } finally {
    close();
  }
});
