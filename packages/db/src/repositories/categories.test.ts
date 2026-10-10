import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCategory,
  listActiveCategories,
  listCategories,
} from "./categories.ts";
import { openMigratedTestDb } from "../testing/helpers.ts";

test("seeds the ten current taxonomy categories ordered by sort", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const categories = await listCategories(db);
    assert.deepEqual(
      categories.map((category) => category.slug),
      [
        "moi-nhat",
        "danh-cho-ban",
        "dang-nong",
        "the-gioi",
        "cong-nghe",
        "ai-channel",
        "giai-tri",
        "kham-pha",
        "doi-song",
        "goc-toi",
      ],
    );
    assert.equal(categories[0].labelVi, "Mới nhất");
    assert.equal(categories[5].labelVi, "AI Channel");
    assert.equal(categories[9].labelVi, "Góc Tối");
    for (const category of categories) {
      assert.equal(category.status, "active");
      assert.equal(category.parentSlug, undefined);
    }
  } finally {
    close();
  }
});

test("getCategory returns a single category by slug", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    const category = await getCategory(db, "the-gioi");
    assert.deepEqual(category, {
      slug: "the-gioi",
      labelVi: "Thế giới",
      parentSlug: undefined,
      sort: 3,
      status: "active",
    });
    assert.equal(
      await getCategory(db, "missing"),
      undefined,
    );
  } finally {
    close();
  }
});

test("listActiveCategories hides archived categories", async () => {
  const { db, close } = await openMigratedTestDb();
  try {
    await db
      .prepare(
        "UPDATE categories SET status = 'archived' WHERE slug = 'goc-toi'",
      )
      .run();
    const slugs = (await listActiveCategories(db)).map(
      (category) => category.slug,
    );
    assert.equal(slugs.length, 9);
    assert.ok(!slugs.includes("goc-toi"));
  } finally {
    close();
  }
});
