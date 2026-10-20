## 2026-10-13 - [Hybrid Glassmorphic Aesthetic & UX Tokens]
**Learning:** Standardizing aesthetic tokens across `packages/ui` avoids cascading regressions. `backdrop-filter: blur(20px) saturate(180%)` provides a seamless Apple-like glass layer across both dark and light modes.
**Action:** Implemented the Hybrid Glassmorphic Portal DNA across `apps/web` (public portal) and `apps/studio` (Telemetry HUD) using `<BentoGrid>` and `<TiltCard>`. Added tactile feedback with `press-scale` and reduced motion compliant `<SpringButton>`.

## 2026-10-17 - Missing Form Focus States (Select Elements)
**Learning:** The custom `focus-visible` ring definition in `apps/web/app/globals.css` and `apps/studio/app/globals.css` included `input` and `textarea` but missed `select` elements. This caused select dropdowns (like the subject dropdown in the contact form) to lack clear visual feedback when navigated via keyboard.
**Action:** Added `select:focus-visible` to the global CSS selector list for both applications to ensure a consistent, accessible focus ring (`outline: 2px solid var(--ai-blue)`) is applied to all form controls, significantly improving keyboard navigation usability.
## 2026-10-20 - Article Share Bar Accessibility
**Learning:** Added aria-label for clear screen reader context on share buttons and aria-live polite region on copy state text. Verified that replacing dynamic text with aria-label on interactive controls might hide the state change for screen readers, so maintained dynamic visible text and used aria-live and aria-hidden to properly announce state changes without double reading.
**Action:** Always maintain aria-live text inside buttons when visual text changes instead of replacing it with a static aria-label, using aria-hidden for decorative elements.
## 2026-10-20 - Deploy Missing KV Bindings Fix
**Learning:** Found that when configuring the `vinext` plugin cache data adapter via `kvDataAdapter()`, the respective KV binding needs to be explicitly defined in `cloudflare.config.ts`. The object format `bindings.kv({ id: "VINEXT_KV_CACHE" })` must be used instead of `{ namespace: ... }` or `bindings.kv("...")` because the TypeScript definitions for `@cloudflare/config` specify `KvBindingOptions` containing an `id` property.
**Action:** Always check the type definitions for specific Cloudflare Workers configurations (e.g. `KvBindingOptions`) before assuming the signature, and configure the `VINEXT_KV_CACHE` binding as `bindings.kv({ id: "VINEXT_KV_CACHE" })` when utilizing caching in Vite plugins.
