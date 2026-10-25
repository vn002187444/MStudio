## 2023-10-27 - Decorative Load More Button Spinner Needs ARIA Hidden
**Learning:** Decorative elements inside loading buttons (like spinning circles or arrows) can cause screen readers to announce confusing extraneous information. Standard disclosure widgets that just reveal text/content should not use `aria-haspopup="menu"`.
**Action:** Always add `aria-hidden="true"` to purely decorative SVGs, spans, or icons within buttons, and explicitly use `aria-busy={loading}` on the button container.
