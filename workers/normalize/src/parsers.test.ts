import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseAtom,
  parseFeed,
  parseJsonFeed,
  parseRss,
} from "./parsers.ts";
import {
  ATOM_SAMPLE,
  JSONFEED_SAMPLE,
  RSS_SAMPLE,
} from "./fixtures/feed-samples.ts";

test("parses RSS fixture items", async () => {
  const items = parseRss(RSS_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://example.com/stories/first");
  assert.equal(
    items[0].externalId,
    "https://example.com/stories/first",
  );
  assert.equal(items[0].title, "First story");
  assert.equal(items[0].publishedAt, "Mon, 05 Jan 2026 00:00:00 GMT");
  assert.equal(items[0].content, "First sample story");
  assert.equal(
    items[1].externalId,
    "urn:example:second",
  );
});

test("parseRss skips items missing both link and guid", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <title>Missing link and guid</title>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 0);
});

test("parseRss handles missing optional fields", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <link>https://example.com/only-link</link>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://example.com/only-link");
  assert.equal(items[0].externalId, undefined);
  assert.equal(items[0].title, undefined);
  assert.equal(items[0].publishedAt, undefined);
  assert.equal(items[0].content, undefined);
});

test("parseRss decodes CDATA blocks", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <title><![CDATA[Title with <tags> & stuff]]></title>
          <link>https://example.com/cdata</link>
          <description><![CDATA[Description with <tags> & stuff]]></description>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Title with <tags> & stuff");
  assert.equal(items[0].content, "Description with <tags> & stuff");
});

test("parseRss decodes HTML entities", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <title>Entities: &lt; &gt; &amp; &quot; &#39; &apos;</title>
          <link>https://example.com/entities</link>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Entities: < > & \" ' '");
});

test("parses Atom fixture items", async () => {
  const items = parseAtom(ATOM_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, "https://atom.example.com/first");
  assert.equal(items[0].externalId, "urn:atom:first");
  assert.equal(items[0].title, "Atom first");
  assert.equal(items[0].publishedAt, "2026-01-05T00:00:00Z");
  assert.equal(items[0].content, "First atom entry");
  assert.equal(items[1].url, "https://atom.example.com/second");
});

test("parseAtom skips entries missing both link and id", async () => {
  const feed = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>Missing link and id</title>
      </entry>
    </feed>
  `;
  const items = parseAtom(feed);
  assert.equal(items.length, 0);
});

test("parseAtom handles missing optional fields", async () => {
  const feed = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>urn:atom:only-id</id>
      </entry>
    </feed>
  `;
  const items = parseAtom(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "urn:atom:only-id"); // Falls back to id if link is missing
  assert.equal(items[0].externalId, "urn:atom:only-id");
  assert.equal(items[0].title, undefined);
  assert.equal(items[0].publishedAt, undefined);
  assert.equal(items[0].content, undefined);
});

test("parseAtom extracts different alternate link formats", async () => {
  const feed = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <link rel="alternate" href="https://atom.example.com/alt1"/>
      </entry>
      <entry>
        <link href="https://atom.example.com/alt2" rel="alternate"/>
      </entry>
      <entry>
        <link href="https://atom.example.com/any"/>
      </entry>
    </feed>
  `;
  const items = parseAtom(feed);
  assert.equal(items.length, 3);
  assert.equal(items[0].url, "https://atom.example.com/alt1");
  assert.equal(items[1].url, "https://atom.example.com/alt2");
  assert.equal(items[2].url, "https://atom.example.com/any");
});

test("parses JSONFeed fixture items", async () => {
  const items = parseJsonFeed(JSONFEED_SAMPLE);
  assert.equal(items.length, 2);
  assert.equal(items[0].externalId, "json-first");
  assert.equal(items[0].url, "https://jsonfeed.example.com/first");
  assert.equal(items[0].title, "JSON first");
  assert.equal(items[0].publishedAt, "2026-01-05T00:00:00Z");
  assert.equal(items[0].content, "<p>First json item</p>");
  assert.equal(items[1].content, "Second json item");
});

test("parseJsonFeed skips items missing both url and external_url", async () => {
  const feed = JSON.stringify({
    items: [
      { id: "missing-url" },
    ],
  });
  const items = parseJsonFeed(feed);
  assert.equal(items.length, 0);
});

test("parseJsonFeed falls back correctly for missing fields", async () => {
  const feed = JSON.stringify({
    items: [
      {
        external_url: "https://jsonfeed.example.com/external",
        content_text: "Fallback text",
      },
    ],
  });
  const items = parseJsonFeed(feed);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://jsonfeed.example.com/external");
  assert.equal(items[0].content, "Fallback text");
});

test("parseJsonFeed handles an empty feed without items", async () => {
  const feed = JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
  });
  const items = parseJsonFeed(feed);
  assert.equal(items.length, 0);
});

test("parseFeed dispatches by content shape", async () => {
  assert.equal(parseFeed(RSS_SAMPLE).length, 2);
  assert.equal(parseFeed(ATOM_SAMPLE).length, 2);
  assert.equal(parseFeed(JSONFEED_SAMPLE).length, 2);
  assert.equal(
    parseFeed(JSONFEED_SAMPLE, "application/json").length,
    2,
  );
});

test("parseFeed dispatches based on content types and heuristics", async () => {
  // Dispatches to JSON when contentType contains "json"
  const fakeJson = '{"items": [{"url": "http://example.com/fake"}]}';
  assert.equal(parseFeed(fakeJson, "application/json").length, 1);
  assert.equal(parseFeed(fakeJson, "application/feed+json").length, 1);

  // Dispatches to JSON when content starts with '{' or '[' (ignoring whitespace)
  const spacedJson = '   \n  { "items": [{"url": "http://example.com/spaced"}] }';
  assert.equal(parseFeed(spacedJson).length, 1);
  assert.equal(parseFeed('[]').length, 0);

  // Dispatches to Atom when content contains <entry> or <feed>
  const fakeAtom = '  <feed> <entry> <id>atom1</id> <link href="http://example.com/atom" /> </entry> </feed>';
  assert.equal(parseFeed(fakeAtom).length, 1);
  const fakeAtom2 = '<?xml version="1.0"?> <entry> <id>atom2</id> <link href="http://example.com/atom2" /> </entry>';
  assert.equal(parseFeed(fakeAtom2).length, 1);

  // Defaults to RSS otherwise
  const fakeRss = ' <rss> <item> <link>http://example.com/rss</link> </item> </rss>';
  assert.equal(parseFeed(fakeRss).length, 1);
  // Even if totally invalid, should try RSS and return empty
  assert.equal(parseFeed('totally random string').length, 0);
});


test("parseRss extracts enclosure image url", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <link>https://example.com/a</link>
          <enclosure url="https://img.example.com/a.jpg" type="image/jpeg" length="123" />
        </item>
        <item>
          <link>https://example.com/b</link>
          <enclosure url="https://example.com/b.mp3" type="audio/mpeg" length="1" />
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items[0].imageUrl, "https://img.example.com/a.jpg");
  assert.equal(items[1].imageUrl, undefined);
});

test("parseRss extracts media:content and media:thumbnail", async () => {
  const feed = `
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <item>
          <link>https://example.com/c</link>
          <media:content url="https://img.example.com/c.webp" medium="image" />
          <media:thumbnail url="https://img.example.com/c-thumb.jpg" />
        </item>
        <item>
          <link>https://example.com/d</link>
          <media:content url="javascript:alert(1)" medium="image" />
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items[0].imageUrl, "https://img.example.com/c.webp");
  assert.equal(items[1].imageUrl, undefined);
});

test("parseAtom extracts image link rel=enclosure", async () => {
  const feed = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>urn:e</id>
        <link rel="alternate" href="https://example.com/e" />
        <link rel="enclosure" type="image/png" href="https://img.example.com/e.png" />
      </entry>
    </feed>
  `;
  const items = parseAtom(feed);
  assert.equal(items[0].imageUrl, "https://img.example.com/e.png");
});

test("parseJsonFeed picks http image only", async () => {
  const json = JSON.stringify({
    items: [
      { url: "https://example.com/f", image: "https://img.example.com/f.jpg" },
      { url: "https://example.com/g", image: "data:image/png;base64,xx" },
    ],
  });
  const items = parseJsonFeed(json);
  assert.equal(items[0].imageUrl, "https://img.example.com/f.jpg");
  assert.equal(items[1].imageUrl, undefined);
});

test("parseAtom extracts YouTube Atom feed with media:description and media:thumbnail", async () => {
  const youtubeAtom = `
    <feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <id>yt:video:dQw4w9WgXcQ</id>
        <yt:videoId>dQw4w9WgXcQ</yt:videoId>
        <title>Never Gonna Give You Up &amp; Never Hurt You</title>
        <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&amp;utm_source=youtube_feed"/>
        <published>2026-03-28T14:00:00+00:00</published>
        <media:group>
          <media:title>Never Gonna Give You Up</media:title>
          <media:thumbnail url="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" width="480" height="360"/>
          <media:description>The official music video for &#8220;Never Gonna Give You Up&#8221; by Rick Astley &#x2014; Remastered!</media:description>
        </media:group>
      </entry>
    </feed>
  `;
  const items = parseAtom(youtubeAtom);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Never Gonna Give You Up & Never Hurt You");
  assert.equal(items[0].url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  assert.equal(items[0].publishedAt, "2026-03-28T14:00:00+00:00");
  assert.equal(
    items[0].content,
    'The official music video for "Never Gonna Give You Up" by Rick Astley — Remastered!',
  );
  assert.equal(
    items[0].imageUrl,
    "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  );
});

test("parseRss prefers content:encoded over short description and cleans tracking params", async () => {
  const rss = `
    <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
      <channel>
        <item>
          <title>Tech Breakthrough</title>
          <link>https://techcrunch.com/2026/04/ai-breakthrough?utm_source=feedburner&amp;utm_medium=feed&amp;fbclid=12345</link>
          <description>Short summary of the article</description>
          <content:encoded><![CDATA[<p>Full comprehensive article with deep analysis and rich technical details.</p>]]></content:encoded>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(rss);
  assert.equal(items.length, 1);
  assert.equal(items[0].url, "https://techcrunch.com/2026/04/ai-breakthrough");
  assert.equal(
    items[0].content,
    "<p>Full comprehensive article with deep analysis and rich technical details.</p>",
  );
});

test("parseAtom extracts Reddit Atom content with HTML entity decoding", async () => {
  const redditAtom = `
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>Discussion on Next Gen AI</title>
        <link href="https://www.reddit.com/r/technology/comments/abc/discussion/?utm_campaign=frontpage"/>
        <content type="html">&lt;div&gt;Reddit post body with &#8216;quotes&#8217; &amp; &copy; 2026&lt;/div&gt;</content>
      </entry>
    </feed>
  `;
  const items = parseAtom(redditAtom);
  assert.equal(items.length, 1);
  assert.equal(
    items[0].url,
    "https://www.reddit.com/r/technology/comments/abc/discussion/",
  );
  assert.equal(
    items[0].content,
    "<div>Reddit post body with 'quotes' & © 2026</div>",
  );
});

test("decodes Vietnamese HTML entities in title and content", async () => {
  const feed = `
    <rss version="2.0">
      <channel>
        <item>
          <title>Chủ tịch FIFA xin lỗi, c&ocirc;ng bố mỗi li&ecirc;n đo&agrave;n nhận 25 triệu USD, c&oacute; Việt Nam</title>
          <link>https://example.com/fifa</link>
          <description>C&ocirc;ng li&ecirc;n đo&agrave;n c&oacute;</description>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 1);
  assert.equal(
    items[0].title,
    "Chủ tịch FIFA xin lỗi, công bố mỗi liên đoàn nhận 25 triệu USD, có Việt Nam",
  );
  assert.equal(items[0].content, "Công liên đoàn có");
});

test("extracts image url correctly from media:content without type/medium, escaped img, and data-src", async () => {
  const feed = `
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <item>
          <title>Media Content</title>
          <link>https://example.com/1</link>
          <media:content url="https://example.com/media.jpg" />
        </item>
        <item>
          <title>Escaped Img</title>
          <link>https://example.com/2</link>
          <description>&lt;img src="https://example.com/escaped.jpg"&gt;</description>
        </item>
        <item>
          <title>Data Src</title>
          <link>https://example.com/3</link>
          <description><img data-src="https://example.com/datasrc.png" /></description>
        </item>
      </channel>
    </rss>
  `;
  const items = parseRss(feed);
  assert.equal(items.length, 3);
  assert.equal(items[0].imageUrl, "https://example.com/media.jpg");
  assert.equal(items[1].imageUrl, "https://example.com/escaped.jpg");
  assert.equal(items[2].imageUrl, "https://example.com/datasrc.png");
});


