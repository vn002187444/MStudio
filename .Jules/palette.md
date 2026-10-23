## 2026-10-13 - [Hybrid Glassmorphic Aesthetic & UX Tokens]
**Learning:** Standardizing aesthetic tokens across `packages/ui` avoids cascading regressions. `backdrop-filter: blur(20px) saturate(180%)` provides a seamless Apple-like glass layer across both dark and light modes.
**Action:** Implemented the Hybrid Glassmorphic Portal DNA across `apps/web` (public portal) and `apps/studio` (Telemetry HUD) using `<BentoGrid>` and `<TiltCard>`. Added tactile feedback with `press-scale` and reduced motion compliant `<SpringButton>`.

## 2026-10-17 - Missing Form Focus States (Select Elements)
**Learning:** The custom `focus-visible` ring definition in `apps/web/app/globals.css` and `apps/studio/app/globals.css` included `input` and `textarea` but missed `select` elements. This caused select dropdowns (like the subject dropdown in the contact form) to lack clear visual feedback when navigated via keyboard.
**Action:** Added `select:focus-visible` to the global CSS selector list for both applications to ensure a consistent, accessible focus ring (`outline: 2px solid var(--ai-blue)`) is applied to all form controls, significantly improving keyboard navigation usability.

## 2026-10-20 - Article Share Bar Accessibility
**Learning:** Added aria-label for clear screen reader context on share buttons and aria-live polite region on copy state text. Verified that replacing dynamic text with aria-label on interactive controls might hide the state change for screen readers, so maintained dynamic visible text and used aria-live and aria-hidden to properly announce state changes without double reading.
**Action:** Always maintain aria-live text inside buttons when visual text changes instead of replacing it with a static aria-label, using aria-hidden for decorative elements.

## 2026-10-21 - Repeated Context-less Action Buttons in Lists
**Learning:** Found that inline action buttons in topic lists (like "Theo dõi" / "Follow" or "Ẩn" / "Hide") lack sufficient context for screen reader users when read out of context. They were being repeatedly read as "Theo dõi, button".
**Action:** Added explicit dynamic `aria-label` to buttons (e.g. `aria-label={\`${isFollow ? "Theo dõi" : "Ẩn"} chủ đề ${topicLabel}\`}`) to provide specific context about exactly which topic is being targeted. Also added `focus-visible` utility classes to support keyboard navigation. This pattern should be applied to all repeating list action buttons.

## 2026-10-21 - Incorrect usage of aria-haspopup on summary elements
**Learning:** Adding `aria-haspopup="menu"` to standard disclosure `<summary>` elements (like the one used for the JSON Debug block in the editor) is a semantic accessibility error. `<details>`/`<summary>` elements inherently convey an expanded/collapsed state natively. `aria-haspopup="menu"` should strictly be reserved for elements that actually trigger a dropdown menu (like navigation dropdowns). Applying it to elements that simply reveal text content misleads screen readers.
**Action:** Do NOT apply `aria-haspopup="menu"` to `<summary>` elements unless they are genuinely triggering a dropdown menu component. Instead, rely on the native expanded/collapsed semantics of `<details>`/`<summary>`. Add `summary:focus-visible` to global CSS to ensure keyboard navigation visibility for all disclosure widgets without altering their ARIA roles.
