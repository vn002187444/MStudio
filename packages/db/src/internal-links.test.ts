import assert from "node:assert/strict";
import { test } from "node:test";
import type { D1Database } from "@cloudflare/workers-types";
import type { EntityKind } from "@mstudio/contracts";
import {
  addRevision,
  addStoryEntity,
  createArticle,
  createEntity,
  createStory,
  getRevision,
} from "./index.ts";
import {
  applyInternalLinks,
  resolveLinkCandidates,
} from "./internal-links.ts";
import { openMigratedTestDb } from "./testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";

async function seedStoryWithEntities(
  db: D1Database,
  entities: { id: string; name: string; kind: EntityKind }[],
): Promise<string> {
  await createStory(db, { id: "story-1", title: "Story", now: NOW });
  for (const entity of entities) {
    await createEntity(db, { ...entity, now: NOW });
    await addStoryEntity(db, {
      storyId: "story-1",
      entityId: entity.id,
    });
  }
  await createArticle(db, {
    id: "article-1",
    storyId: "story-1",
    now: NOW,
  });
  return "story-1";
}

test("inserts up to maxLinks contextual anchors", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStoryWithEntities(db, [
      { id: "e1", name: "Nguyen Van A", kind: "person" },
      { id: "e2", name: "Acme Corp", kind: "organization" },
      { id: "e3", name: "Hanoi", kind: "location" },
      { id: "e4", name: "Export Policy", kind: "concept" },
    ]);
    const candidates = await resolveLinkCandidates(db, "story-1");
    assert.equal(candidates.length, 4);
    const body = applyInternalLinks(
      "Nguyen Van A met Acme Corp in Hanoi to discuss Export Policy details.",
      candidates,
    );
    assert.ok(body.includes("[Nguyen Van A](/nhan-vat/nguyen-van-a)"));
    assert.ok(body.includes("[Acme Corp](/to-chuc/acme-corp)"));
    assert.ok(body.includes("[Hanoi](/quoc-gia/hanoi)"));
    assert.equal(body.includes("Export Policy]("), false);
    assert.equal((body.match(/\]\(/g) ?? []).length, 3);
  } finally {
    close();
  }
});

test("no duplicate anchors for repeated mentions or shared targets", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStoryWithEntities(db, [
      { id: "e1", name: "Hanoi", kind: "location" },
    ]);
    const candidates = await resolveLinkCandidates(db, "story-1");
    const body = applyInternalLinks(
      "Hanoi is crowded. Hanoi traffic is heavy. Hanoi food is great.",
      candidates,
    );
    assert.equal((body.match(/\[Hanoi\]/g) ?? []).length, 1);
    assert.equal((body.match(/Hanoi/g) ?? []).length, 4);
  } finally {
    close();
  }
});

test("no stuffing: existing links, headings and word fragments untouched", async () => {
  const candidates = [
    {
      entityId: "e1",
      name: "Hanoi",
      target: "/quoc-gia/hanoi",
    },
    {
      entityId: "e2",
      name: "Hanoi Towers",
      target: "/to-chuc/hanoi-towers",
    },
  ];
  const body = applyInternalLinks(
    [
      "## Hanoi Overview",
      "See [Hanoi](/quoc-gia/hanoi) for background.",
      "The Hanoi Towers project broke ground near old Hanoi quarters.",
    ].join("\n"),
    candidates,
  );
  assert.ok(body.includes("## Hanoi Overview"));
  assert.equal((body.match(/\[Hanoi\]/g) ?? []).length, 1);
  assert.ok(body.includes("[Hanoi Towers](/to-chuc/hanoi-towers)"));
  assert.ok(body.includes("old Hanoi quarters"));
});

test("excluded category slugs skip linking entirely", async () => {
  const candidates = [
    {
      entityId: "e1",
      name: "Hanoi",
      target: "/quoc-gia/hanoi",
    },
  ];
  const original = "Hanoi at night.";
  assert.equal(
    applyInternalLinks(original, candidates, {
      excludedCategorySlugs: ["goc-toi"],
      articleCategorySlug: "goc-toi",
    }),
    original,
  );
  assert.ok(
    applyInternalLinks(original, candidates, {
      excludedCategorySlugs: ["goc-toi"],
      articleCategorySlug: "thoi-su",
    }).includes("[Hanoi](/quoc-gia/hanoi)"),
  );
});

test("addRevision applies internal links only when opted in", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStoryWithEntities(db, [
      { id: "e1", name: "Hanoi", kind: "location" },
    ]);
    const plain = await addRevision(db, {
      id: "rev-1",
      articleId: "article-1",
      title: "T",
      body: "Hanoi at night.",
      now: NOW,
    });
    assert.equal(plain.body, "Hanoi at night.");
    const linked = await addRevision(
      db,
      {
        id: "rev-2",
        articleId: "article-1",
        title: "T",
        body: "Hanoi at night.",
        now: NOW,
      },
      { internalLinks: { storyId: "story-1" } },
    );
    assert.equal(linked.body, "[Hanoi](/quoc-gia/hanoi) at night.");
    const stored = await getRevision(db, "rev-2");
    assert.equal(stored?.body, "[Hanoi](/quoc-gia/hanoi) at night.");
  } finally {
    close();
  }
});
