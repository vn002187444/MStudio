## 2026-10-13 - [Hybrid Glassmorphic Aesthetic & UX Tokens]
**Learning:** Standardizing aesthetic tokens across `packages/ui` avoids cascading regressions. `backdrop-filter: blur(20px) saturate(180%)` provides a seamless Apple-like glass layer across both dark and light modes.
**Action:** Implemented the Hybrid Glassmorphic Portal DNA across `apps/web` (public portal) and `apps/studio` (Telemetry HUD) using `<BentoGrid>` and `<TiltCard>`. Added tactile feedback with `press-scale` and reduced motion compliant `<SpringButton>`.

## 2026-10-17 - Missing Form Focus States (Select Elements)
**Learning:** The custom `focus-visible` ring definition in `apps/web/app/globals.css` and `apps/studio/app/globals.css` included `input` and `textarea` but missed `select` elements. This caused select dropdowns (like the subject dropdown in the contact form) to lack clear visual feedback when navigated via keyboard.
**Action:** Added `select:focus-visible` to the global CSS selector list for both applications to ensure a consistent, accessible focus ring (`outline: 2px solid var(--ai-blue)`) is applied to all form controls, significantly improving keyboard navigation usability.
