import assert from "node:assert/strict";
import { test } from "node:test";
import { articleStructuredData, canonicalizeUrl, isTrackingParam } from "./index.ts";

test("canonicalizeUrl strips tracking params", async () => {
  const canonical = canonicalizeUrl(
    "https://Example.com/story?utm_source=x&utm_medium=y&id=42&fbclid=abc",
  );
  assert.equal(canonical, "https://example.com/story?id=42");
  assert.equal(isTrackingParam("utm_source"), true);
  assert.equal(isTrackingParam("id"), false);
});

test("canonicalizeUrl normalizes protocol, host, fragment, trailing slash", async () => {
  const canonical = canonicalizeUrl("HTTP://EXAMPLE.com/Story/#section");
  assert.equal(canonical, "https://example.com/Story");
  const root = canonicalizeUrl("https://example.com/");
  assert.equal(root, "https://example.com/");
});

test("canonicalizeUrl sorts remaining params and supports baseUrl", async () => {
  const canonical = canonicalizeUrl("/story?b=2&a=1", {
    baseUrl: "https://news.example.com",
  });
  assert.equal(canonical, "https://news.example.com/story?a=1&b=2");
});

test("canonicalizeUrl can keep http when forced off", async () => {
  const canonical = canonicalizeUrl("http://example.com/x", {
    forceHttps: false,
  });
  assert.equal(canonical, "http://example.com/x");
});

test("articleStructuredData builds NewsArticle JSON-LD", async () => {
  const data = articleStructuredData({
    headline: "Market rallies",
    description: "Budget passes as markets climb.",
    canonicalUrl: "https://news.example.com/story/market?utm_source=x",
    publishedAt: "2026-01-05T00:00:00Z",
    modifiedAt: "2026-01-06T00:00:00Z",
    author: "Jane Reporter",
    publisherName: "MStudio News",
    publisherLogoUrl: "https://news.example.com/logo.png",
    imageUrls: ["https://news.example.com/img/a.png?ref=home"],
  });
  assert.equal(data["@type"], "NewsArticle");
  assert.equal(data.headline, "Market rallies");
  assert.equal(data.datePublished, "2026-01-05T00:00:00Z");
  assert.equal(data.dateModified, "2026-01-06T00:00:00Z");
  assert.equal(
    data.mainEntityOfPage["@id"],
    "https://news.example.com/story/market",
  );
  assert.equal(data.author?.name, "Jane Reporter");
  assert.equal(data.publisher.name, "MStudio News");
  assert.equal(data.publisher.logo?.url, "https://news.example.com/logo.png");
  assert.deepEqual(data.image, ["https://news.example.com/img/a.png"]);
});

test("articleStructuredData omits optional fields when absent", async () => {
  const data = articleStructuredData({
    headline: "Plain",
    description: "Plain description",
    canonicalUrl: "https://news.example.com/plain",
    publishedAt: "2026-01-05T00:00:00Z",
    publisherName: "MStudio",
  });
  assert.equal(data.author, undefined);
  assert.equal(data.publisher.logo, undefined);
  assert.equal(data.image, undefined);
  assert.equal(data.dateModified, data.datePublished);
});
