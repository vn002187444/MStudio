import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildNewsSitemap,
  buildSitemap,
  buildSitemapEvent,
  isWithinNewsWindow,
  NEWS_WINDOW_MS,
} from "./index.ts";

test("buildSitemap produces a valid urlset", async () => {
  const xml = buildSitemap([
    {
      loc: "https://news.example.com/story/one",
      lastmod: "2026-01-05",
      changefreq: "daily",
      priority: 0.8,
    },
    { loc: "https://news.example.com/story/two" },
  ]);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/news\.example\.com\/story\/one<\/loc>/);
  assert.match(xml, /<lastmod>2026-01-05<\/lastmod>/);
  assert.match(xml, /<changefreq>daily<\/changefreq>/);
  assert.match(xml, /<priority>0\.8<\/priority>/);
  assert.match(xml, /<\/urlset>$/);
  const urlCount = (xml.match(/<url>/g) ?? []).length;
  assert.equal(urlCount, 2);
});

test("buildSitemap escapes XML metacharacters", async () => {
  const xml = buildSitemap([
    { loc: "https://news.example.com/a?x=1&y=2" },
  ]);
  assert.match(xml, /&amp;/);
  assert.ok(!/x=1&y=2/.test(xml));
});

test("buildNewsSitemap emits Google News namespace and fields", async () => {
  const xml = buildNewsSitemap([
    {
      loc: "https://news.example.com/story/one",
      title: "Market rallies",
      publicationDate: "2026-01-05T00:00:00Z",
      publicationName: "MStudio News",
      language: "en",
    },
  ]);
  assert.match(xml, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(xml, /<news:publication>/);
  assert.match(xml, /<news:name>MStudio News<\/news:name>/);
  assert.match(xml, /<news:language>en<\/news:language>/);
  assert.match(xml, /<news:publication_date>2026-01-05T00:00:00Z<\/news:publication_date>/);
  assert.match(xml, /<news:title>Market rallies<\/news:title>/);
});

test("isWithinNewsWindow keeps only last 48 hours", async () => {
  const now = Date.parse("2026-01-06T12:00:00Z");
  assert.equal(
    isWithinNewsWindow("2026-01-06T00:00:00Z", now),
    true,
  );
  assert.equal(
    isWithinNewsWindow("2026-01-04T00:00:00Z", now),
    false,
  );
  assert.equal(isWithinNewsWindow("not-a-date", now), false);
  assert.ok(NEWS_WINDOW_MS > 0);
});

test("buildSitemapEvent builds event payload", async () => {
  const event = buildSitemapEvent(
    "article_published",
    "https://news.example.com/story/one",
    "2026-01-06T00:00:00Z",
  );
  assert.deepEqual(event, {
    kind: "article_published",
    url: "https://news.example.com/story/one",
    lastmod: "2026-01-06T00:00:00Z",
  });
  const defaultLastmod = buildSitemapEvent(
    "article_updated",
    "https://news.example.com/story/two",
  );
  assert.ok(Date.parse(defaultLastmod.lastmod) > 0);
});
