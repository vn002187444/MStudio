import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addStoryEntity,
  addStorySource,
  createClaim,
  createEntity,
  createFact,
  createFeed,
  createRawItem,
  createSource,
  createStory,
  deleteSource,
  getStory,
  listClaims,
  listFacts,
  listStoryEntities,
  listStorySources,
  listStories,
  removeStoryEntity,
  removeStorySource,
  setClaimStatus,
  updateFactConfidence,
  updateStory,
  updateStoryStatus,
} from "../index.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-01-01T00:00:00.000Z";
const LATER = "2026-01-01T00:00:01.000Z";

async function seedStory(db: Parameters<typeof createStory>[0]): Promise<string> {
  const story = await createStory(db, {
    id: "story-1",
    title: "First story",
    now: NOW,
  });
  return story.id;
}

async function seedRawItem(
  db: Parameters<typeof createStory>[0],
  id: string,
  externalId: string,
): Promise<void> {
  await createSource(db, {
    id: `source-${id}`,
    name: `Source ${id}`,
    originUrl: `https://source-${id}.example.com`,
    kind: "rss",
    now: NOW,
  });
  await createFeed(db, {
    id: `feed-${id}`,
    sourceId: `source-${id}`,
    url: `https://source-${id}.example.com/feed.xml`,
    format: "rss",
    now: NOW,
  });
  await createRawItem(db, {
    id,
    feedId: `feed-${id}`,
    sourceId: `source-${id}`,
    externalId,
    url: `https://source-${id}.example.com/${externalId}`,
    fetchedAt: NOW,
    payloadHash: `hash-${externalId}`,
  });
}

test("creates and reads a story with defaults", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const story = await createStory(db, {
      id: "story-1",
      title: "First story",
      now: NOW,
    });
    assert.equal(story.title, "First story");
    assert.equal(story.status, "draft");
    assert.equal(story.summary, undefined);
    assert.equal(story.createdAt, NOW);
    const read = await getStory(db, "story-1");
    assert.deepEqual(read, story);
  } finally {
    close();
  }
});

test("lists stories with keyset pagination", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await createStory(db, { id: "story-a", title: "A", now: NOW });
    await createStory(db, { id: "story-b", title: "B", now: LATER });
    await createStory(db, { id: "story-c", title: "C", now: LATER });
    const first = await listStories(db, { limit: 2 });
    assert.equal(first.rows.length, 2);
    assert.ok(first.nextCursor);
    const second = await listStories(db, {
      limit: 2,
      cursor: first.nextCursor,
    });
    assert.equal(second.rows.length, 1);
    assert.equal(second.nextCursor, undefined);
  } finally {
    close();
  }
});

test("updates story patch and status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    const patched = await updateStory(db, "story-1", {
      title: "Renamed",
      summary: "Summary text",
    });
    assert.equal(patched?.title, "Renamed");
    assert.equal(patched?.summary, "Summary text");
    const transitioned = await updateStoryStatus(
      db,
      "story-1",
      "researching",
    );
    assert.equal(transitioned?.status, "researching");
    const missing = await updateStoryStatus(db, "nope", "ready");
    assert.equal(missing, undefined);
  } finally {
    close();
  }
});

test("story sources add, list, remove and dedupe", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    await seedRawItem(db, "item-1", "ext-1");
    const first = await addStorySource(db, {
      id: "ss-1",
      storyId: "story-1",
      rawItemId: "item-1",
      role: "primary",
      now: NOW,
    });
    assert.equal(first.created, true);
    assert.equal(first.row.role, "primary");
    const again = await addStorySource(db, {
      id: "ss-1-dup",
      storyId: "story-1",
      rawItemId: "item-1",
      role: "primary",
      now: LATER,
    });
    assert.equal(again.created, false);
    assert.equal(again.row.id, "ss-1");
    const sources = await listStorySources(db, "story-1");
    assert.equal(sources.length, 1);
    const removed = await removeStorySource(db, "ss-1");
    assert.equal(removed, true);
    assert.equal(
      (await listStorySources(db, "story-1")).length,
      0,
    );
  } finally {
    close();
  }
});

test("facts roundtrip source refs and confidence", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    const fact = await createFact(db, {
      id: "fact-1",
      storyId: "story-1",
      text: "The launch happened on Monday",
      sourceRefs: ["item-1", "item-2"],
      confidence: 0.8,
      now: NOW,
    });
    assert.deepEqual(fact.sourceRefs, ["item-1", "item-2"]);
    assert.equal(fact.confidence, 0.8);
    const listed = await listFacts(db, "story-1");
    assert.equal(listed.length, 1);
    assert.deepEqual(listed[0].sourceRefs, ["item-1", "item-2"]);
    const updated = await updateFactConfidence(
      db,
      "fact-1",
      0.42,
    );
    assert.equal(updated?.confidence, 0.42);
  } finally {
    close();
  }
});

test("claims transition status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    const claim = await createClaim(db, {
      id: "claim-1",
      storyId: "story-1",
      text: "The mayor confirmed the budget",
      now: NOW,
    });
    assert.equal(claim.status, "pending");
    const confirmed = await setClaimStatus(
      db,
      "claim-1",
      "confirmed",
    );
    assert.equal(confirmed?.status, "confirmed");
    const claims = await listClaims(db, "story-1");
    assert.equal(claims.length, 1);
    assert.equal(claims[0].status, "confirmed");
  } finally {
    close();
  }
});

test("entities dedupe by normalized name", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const first = await createEntity(db, {
      id: "entity-1",
      name: "  Cloudflare ",
      kind: "organization",
      now: NOW,
    });
    assert.equal(first.created, true);
    assert.equal(first.row.normalizedName, "cloudflare");
    const second = await createEntity(db, {
      id: "entity-2",
      name: "CLOUDFLARE",
      kind: "organization",
      now: LATER,
    });
    assert.equal(second.created, false);
    assert.equal(second.row.id, "entity-1");
    const other = await createEntity(db, {
      id: "entity-3",
      name: "Cloudflare",
      kind: "person",
      now: LATER,
    });
    assert.equal(other.created, true);
  } finally {
    close();
  }
});

test("story entities add, list and remove", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    const entity = await createEntity(db, {
      id: "entity-1",
      name: "MStudio",
      kind: "organization",
      now: NOW,
    });
    const added = await addStoryEntity(db, {
      storyId: "story-1",
      entityId: entity.row.id,
      role: "subject",
    });
    assert.equal(added, true);
    const duplicated = await addStoryEntity(db, {
      storyId: "story-1",
      entityId: entity.row.id,
      role: "subject",
    });
    assert.equal(duplicated, false);
    const linked = await listStoryEntities(db, "story-1");
    assert.deepEqual(linked, [
      {
        storyId: "story-1",
        entityId: "entity-1",
        role: "subject",
      },
    ]);
    const removed = await removeStoryEntity(
      db,
      "story-1",
      "entity-1",
    );
    assert.equal(removed, true);
    assert.equal(
      (await listStoryEntities(db, "story-1")).length,
      0,
    );
  } finally {
    close();
  }
});

test("deleting a story cascades to evidence tables", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    await seedRawItem(db, "item-1", "ext-1");
    await addStorySource(db, {
      id: "ss-1",
      storyId: "story-1",
      rawItemId: "item-1",
      now: NOW,
    });
    await createFact(db, {
      id: "fact-1",
      storyId: "story-1",
      text: "Fact",
      now: NOW,
    });
    await createClaim(db, {
      id: "claim-1",
      storyId: "story-1",
      text: "Claim",
      now: NOW,
    });
    const entity = await createEntity(db, {
      id: "entity-1",
      name: "MStudio",
      kind: "organization",
      now: NOW,
    });
    await addStoryEntity(db, {
      storyId: "story-1",
      entityId: entity.row.id,
    });

    await db
      .prepare("DELETE FROM stories WHERE id = ?")
      .bind("story-1")
      .run();

    assert.equal((await listStorySources(db, "story-1")).length, 0);
    assert.equal((await listFacts(db, "story-1")).length, 0);
    assert.equal((await listClaims(db, "story-1")).length, 0);
    assert.equal(
      (await listStoryEntities(db, "story-1")).length,
      0,
    );
    const rawItems = (
      await db
        .prepare("SELECT COUNT(*) AS count FROM raw_items")
        .all<{ count: number }>()
    ).results[0];
    assert.equal(rawItems?.count, 1);
    const entities = (
      await db
        .prepare("SELECT COUNT(*) AS count FROM entities")
        .all<{ count: number }>()
    ).results[0];
    assert.equal(entities?.count, 1);
  } finally {
    close();
  }
});

test("story source rejects unknown raw item via FK", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedStory(db);
    await assert.rejects(
      addStorySource(db, {
        id: "ss-bad",
        storyId: "story-1",
        rawItemId: "missing-item",
        now: NOW,
      }),
    );
  } finally {
    close();
  }
});

test("story status rejects invalid value via check constraint", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await assert.rejects(
      createStory(db, {
        id: "story-bad",
        title: "Bad",
        status: "broken" as never,
        now: NOW,
      }),
    );
  } finally {
    close();
  }
});
