export const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example News</title>
    <link>https://example.com</link>
    <item>
      <title>First story</title>
      <link>https://example.com/stories/first</link>
      <guid>https://example.com/stories/first</guid>
      <pubDate>Mon, 05 Jan 2026 00:00:00 GMT</pubDate>
      <description>First sample story</description>
    </item>
    <item>
      <title>Second story</title>
      <link>https://example.com/stories/second</link>
      <guid isPermaLink="false">urn:example:second</guid>
      <pubDate>Mon, 05 Jan 2026 01:00:00 GMT</pubDate>
      <description>Second sample story</description>
    </item>
  </channel>
</rss>`;

export const ATOM_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom News</title>
  <entry>
    <title>Atom first</title>
    <id>urn:atom:first</id>
    <link rel="alternate" href="https://atom.example.com/first"/>
    <updated>2026-01-05T00:00:00Z</updated>
    <summary>First atom entry</summary>
  </entry>
  <entry>
    <title>Atom second</title>
    <id>urn:atom:second</id>
    <link href="https://atom.example.com/second"/>
    <updated>2026-01-05T01:00:00Z</updated>
    <summary>Second atom entry</summary>
  </entry>
</feed>`;

export const JSONFEED_SAMPLE = JSON.stringify({
  version: "https://jsonfeed.org/version/1.1",
  title: "JSON News",
  home_page_url: "https://jsonfeed.example.com",
  items: [
    {
      id: "json-first",
      url: "https://jsonfeed.example.com/first",
      title: "JSON first",
      date_published: "2026-01-05T00:00:00Z",
      content_html: "<p>First json item</p>",
    },
    {
      id: "json-second",
      url: "https://jsonfeed.example.com/second",
      title: "JSON second",
      date_published: "2026-01-05T01:00:00Z",
      content_text: "Second json item",
    },
  ],
});
