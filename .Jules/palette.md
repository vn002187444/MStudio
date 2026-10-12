## 2023-10-10 - Missing Form Focus States
**Learning:** This app's global CSS sets a custom `focus-visible` ring on `a`, `button`, and `summary` but missed `input` and `textarea`. Because custom CSS reset/override was used without encompassing all interactive elements, keyboard accessibility suffered on form fields like Search or Editor inputs.
**Action:** Always verify that custom global focus rings cover all focusable form controls (`input`, `textarea`, `select`), not just navigational or button elements.

## 2026-10-11 - Disabled State Visual Feedback
**Learning:** Found several input fields without visual focus indicators for keyboard navigation and missing/poor disabled states in `EditorPage` `TopicAction` and `SearchPage`. Found `btn-primary` which does not use focus-visible styling correctly for its disabled state (opacity is not reduced, cursor is still pointer).
**Action:** Enhance accessibility by ensuring correct disabled state classes in CSS, adding clear text-based feedback when an action is triggered, and improving interactive elements' `focus-visible` behaviors. Picked one micro-UX improvement: fixing disabled button styles in `globals.css`.

## 2024-03-24 - Preventing Data Loss in Editor
**Learning:** Users can accidentally delete text blocks in the rich text editor because the delete button has no confirmation, leading to immediate data loss.
**Action:** Always add a confirmation dialog (e.g., `window.confirm`) for destructive actions like deleting content blocks.
