/**
 * Studio primary navigation.
 * Newsroom review/publish/sources + overview/clusters/drafts/scheduled/
 * corrections đã live; SEO, audience, media, automation, settings vẫn chờ.
 */
const items: Array<{ href: string; label: string; disabled?: boolean }> = [
  { href: "/", label: "Home" },
  { href: "/overview", label: "Overview" },
  { href: "/editor", label: "Article Editor" },
  { href: "/newsroom/incoming", label: "Incoming" },
  { href: "/clusters", label: "Story Clusters" },
  { href: "/newsroom/research", label: "Research Desk" },
  { href: "/drafts", label: "Drafts" },
  { href: "/newsroom/needs-review", label: "Needs Review" },
  { href: "/scheduled", label: "Scheduled" },
  { href: "/newsroom/published", label: "Published" },
  { href: "/corrections", label: "Corrections" },
  { href: "/newsroom/sources", label: "Sources" },
  { href: "/ai-desk", label: "AI Desk" },
  { href: "/seo", label: "SEO & Discovery" },
  { href: "/audience", label: "Audience & Analytics" },
  { href: "/media", label: "Media" },
  { href: "/automation", label: "Automation" },
  { href: "/settings", label: "Settings" },
];

export function StudioNav() {
  return (
    <nav aria-label="Studio chính">
      <ul style={{ display: "flex", flexDirection: "column", gap: 4, listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item) =>
          item.disabled ? (
            <li key={item.label}>
              <span
                aria-disabled="true"
                style={{ color: "var(--white)", display: "block", opacity: 0.65, padding: "8px 12px" }}
              >
                {item.label}
              </span>
            </li>
          ) : (
            <li key={item.label}>
              <a
                href={item.href}
                style={{
                  borderRadius: "var(--radius-sm)",
                  color: "var(--white)",
                  display: "block",
                  padding: "8px 12px",
                }}
              >
                {item.label}
              </a>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
