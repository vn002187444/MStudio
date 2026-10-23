with open("workers/api/src/index.ts", "r") as f:
    content = f.read()

new_content = content.replace(
    """  const idsParam = url.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length > 0) {
      const { getPublishedArticlesByIds } = await import("@mstudio/db");
      const rows = await getPublishedArticlesByIds(c.env.DB, ids);
      return c.json({ rows });
    }
  }""",
    """  const idsParam = url.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length > 0) {
      // Dynamic import bypasses top-level Cloudflare Worker resolution restrictions
      // inside routing logic if needed, but standard static imports are preferred
      // if available.
      const { getPublishedArticlesByIds } = await import("@mstudio/db");
      const rows = await getPublishedArticlesByIds(c.env.DB, ids);
      return c.json({ rows });
    }
  }"""
)

with open("workers/api/src/index.ts", "w") as f:
    f.write(new_content)
