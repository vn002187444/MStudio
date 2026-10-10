import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createArticle,
  createStory,
} from "../index.ts";
import {
  createMediaAsset,
  getMediaAsset,
  listMediaAssetsByArticle,
} from "./media.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

const NOW = "2026-10-10T00:00:00.000Z";

async function seedArticle(
  db: Parameters<typeof createStory>[0],
  id: string,
): Promise<void> {
  await createStory(db, {
    id: `story-${id}`,
    title: `Story ${id}`,
    now: NOW,
  });
  await createArticle(db, {
    id,
    storyId: `story-${id}`,
    status: "drafted",
    now: NOW,
  });
}

test("createMediaAsset round-trips with defaults", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const created = await createMediaAsset(db, {
      id: "media-1",
      originUrl: "https://img.example.com/hero.jpg",
      r2Key: "media/abc123.jpg",
      rightsStatus: "clear",
      createdAt: NOW,
    });
    assert.equal(created.id, "media-1");
    assert.equal(created.articleId, undefined);
    assert.equal(created.rightsStatus, "clear");
    assert.equal(created.r2Key, "media/abc123.jpg");
    const read = await getMediaAsset(db, "media-1");
    assert.deepEqual(read, created);
  } finally {
    close();
  }
});

test("createMediaAsset defaults rights to unknown", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const created = await createMediaAsset(db, {
      id: "media-2",
      originUrl: "https://img.example.com/x.png",
      createdAt: NOW,
    });
    assert.equal(created.rightsStatus, "unknown");
    assert.equal(created.r2Key, undefined);
  } finally {
    close();
  }
});

test("listMediaAssetsByArticle returns only linked assets", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await seedArticle(db, "art-1");
    await createMediaAsset(db, {
      id: "media-a",
      articleId: "art-1",
      originUrl: "https://img.example.com/a.jpg",
      createdAt: NOW,
    });
    await createMediaAsset(db, {
      id: "media-b",
      articleId: "art-1",
      originUrl: "https://img.example.com/b.jpg",
      createdAt: NOW,
    });
    await createMediaAsset(db, {
      id: "media-c",
      originUrl: "https://img.example.com/c.jpg",
      createdAt: NOW,
    });
    const linked = await listMediaAssetsByArticle(
      db,
      "art-1",
    );
    assert.deepEqual(
      linked.map((asset) => asset.id).sort(),
      ["media-a", "media-b"],
    );
    assert.equal(
      (await listMediaAssetsByArticle(db, "art-2")).length,
      0,
    );
  } finally {
    close();
  }
});

test("createMediaAsset rejects an invalid rights status", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await assert.rejects(
      createMediaAsset(db, {
        id: "media-d",
        originUrl: "https://img.example.com/d.jpg",
        rightsStatus: "public-domain" as never,
        createdAt: NOW,
      }),
    );
  } finally {
    close();
  }
});
