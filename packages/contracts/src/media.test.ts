import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CATEGORY_FALLBACK_IMAGES,
  DEFAULT_FALLBACK_CATEGORY,
  resolveCategoryFallbackImage,
  resolveHeroImageUrl,
} from "./media.ts";

test("every canonical category maps to an https image", async () => {
  for (const [slug, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    assert.ok(slug.length > 0, "empty category slug");
    assert.ok(url.startsWith("https://"), `${slug} must be https`);
  }
  assert.ok(CATEGORY_FALLBACK_IMAGES[DEFAULT_FALLBACK_CATEGORY]);
});

test("resolveCategoryFallbackImage falls back to the default category", async () => {
  const expected = CATEGORY_FALLBACK_IMAGES[DEFAULT_FALLBACK_CATEGORY];
  assert.equal(resolveCategoryFallbackImage("the-gioi"), CATEGORY_FALLBACK_IMAGES["the-gioi"]);
  assert.equal(resolveCategoryFallbackImage("unknown-category"), expected);
  assert.equal(resolveCategoryFallbackImage(null), expected);
  assert.equal(resolveCategoryFallbackImage(undefined), expected);
  assert.equal(resolveCategoryFallbackImage("   "), expected);
});

test("resolveHeroImageUrl prefers a real image url", async () => {
  assert.equal(
    resolveHeroImageUrl("https://example.com/hero.jpg", "cong-nghe"),
    "https://example.com/hero.jpg",
  );
  assert.equal(
    resolveHeroImageUrl("  https://example.com/hero.jpg  ", "cong-nghe"),
    "https://example.com/hero.jpg",
  );
});

test("resolveHeroImageUrl uses the category image when missing", async () => {
  assert.equal(
    resolveHeroImageUrl(null, "the-thao"),
    CATEGORY_FALLBACK_IMAGES["the-thao"],
  );
  assert.equal(
    resolveHeroImageUrl("", "doi-song"),
    CATEGORY_FALLBACK_IMAGES["doi-song"],
  );
  assert.equal(
    resolveHeroImageUrl(undefined),
    CATEGORY_FALLBACK_IMAGES[DEFAULT_FALLBACK_CATEGORY],
  );
});
