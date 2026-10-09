/**
 * Studio primary navigation (MST-005 placeholder).
 * Full Newsroom modules arrive in later tasks — only Overview and Incoming
 * have routes; the rest are disabled placeholders.
 */
const items = [
  { href: "/", label: "Overview" },
  { href: "/newsroom/incoming", label: "Incoming" },
  { href: "#", label: "Story Clusters", disabled: true },
  { href: "/newsroom/research", label: "Research Desk" },
  { href: "#", label: "Drafts", disabled: true },
  { href: "#", label: "Needs Review", disabled: true },
  { href: "#", label: "Sources", disabled: true },
  { href: "/ai-desk", label: "AI Desk" },
  { href: "#", label: "SEO & Discovery", disabled: true },
  { href: "#", label: "Audience", disabled: true },
  { href: "#", label: "Media", disabled: true },
  { href: "#", label: "Automation", disabled: true },
  { href: "#", label: "Settings", disabled: true },
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
