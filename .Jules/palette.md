## 2026-10-13 - [Hybrid Glassmorphic Aesthetic & UX Tokens]
**Learning:** Standardizing aesthetic tokens across `packages/ui` avoids cascading regressions. `backdrop-filter: blur(20px) saturate(180%)` provides a seamless Apple-like glass layer across both dark and light modes.
**Action:** Implemented the Hybrid Glassmorphic Portal DNA across `apps/web` (public portal) and `apps/studio` (Telemetry HUD) using `<BentoGrid>` and `<TiltCard>`. Added tactile feedback with `press-scale` and reduced motion compliant `<SpringButton>`.

## 2026-10-17 - Missing Form Focus States (Select Elements)
**Learning:** The custom `focus-visible` ring definition in `apps/web/app/globals.css` and `apps/studio/app/globals.css` included `input` and `textarea` but missed `select` elements. This caused select dropdowns (like the subject dropdown in the contact form) to lack clear visual feedback when navigated via keyboard.
**Action:** Added `select:focus-visible` to the global CSS selector list for both applications to ensure a consistent, accessible focus ring (`outline: 2px solid var(--ai-blue)`) is applied to all form controls, significantly improving keyboard navigation usability.
## 2026-10-20 - Article Share Bar Accessibility
**Learning:** Added aria-label for clear screen reader context on share buttons and aria-live polite region on copy state text. Verified that replacing dynamic text with aria-label on interactive controls might hide the state change for screen readers, so maintained dynamic visible text and used aria-live and aria-hidden to properly announce state changes without double reading.
**Action:** Always maintain aria-live text inside buttons when visual text changes instead of replacing it with a static aria-label, using aria-hidden for decorative elements.
## 2026-10-22 - Missing ARIA roles and keyboard states on details/summary menus
**Learning:** `summary` elements acting as dropdown toggles (like in navigation menus) need `aria-haspopup="menu"` for screen readers to understand they open a menu. Additionally, when using `summary` elements, they require custom `focus-visible` styling since they are natively interactive but often missed in global focus resets.
**Action:** Added `summary:focus-visible` to global focus rules in both apps, and added `aria-haspopup="menu"` to the navigation `summary` elements in the web app header. Also added `aria-expanded` to the mobile menu toggle button in the studio app to properly announce its state.
