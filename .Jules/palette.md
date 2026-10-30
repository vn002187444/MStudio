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

## 2026-10-22 - Missing ARIA roles and keyboard states on details/summary menus
**Learning:** `summary` elements acting as dropdown toggles (like in navigation menus) need `aria-haspopup="menu"` for screen readers to understand they open a menu. Additionally, when using `summary` elements, they require custom `focus-visible` styling since they are natively interactive but often missed in global focus resets.
**Action:** Added `summary:focus-visible` to global focus rules in both apps, and added `aria-haspopup="menu"` to the navigation `summary` elements in the web app header. Also added `aria-expanded` to the mobile menu toggle button in the studio app to properly announce its state.

## 2026-10-21 - Incorrect usage of aria-haspopup on summary elements
**Learning:** Adding `aria-haspopup="menu"` to standard disclosure `<summary>` elements (like the one used for the JSON Debug block in the editor) is a semantic accessibility error. `<details>`/`<summary>` elements inherently convey an expanded/collapsed state natively. `aria-haspopup="menu"` should strictly be reserved for elements that actually trigger a dropdown menu (like navigation dropdowns). Applying it to elements that simply reveal text content misleads screen readers.
**Action:** Do NOT apply `aria-haspopup="menu"` to `<summary>` elements unless they are genuinely triggering a dropdown menu component. Instead, rely on the native expanded/collapsed semantics of `<details>`/`<summary>`. Add `summary:focus-visible` to global CSS to ensure keyboard navigation visibility for all disclosure widgets without altering their ARIA roles.
## 2024-10-24 - Accessibility improvements for icon-only buttons
**Learning:** Found that decorative text-based icons (✏️, 🗑️, ×) in icon-only buttons lacked proper ARIA attributes, causing screen readers to either ignore them or read out distracting textual approximations without clear context.
**Action:** Added `aria-label` attributes to these icon-only buttons to clearly state their purpose (e.g. "Chỉnh sửa nguồn", "Xoá nguồn") and wrapped the emoji/character symbols in `<span aria-hidden="true">` to prevent distracting interruptions for screen reader users. Always apply this pattern to icon-only buttons to ensure they remain accessible without extra visual clutter.

## 2026-10-25 - Decorative Load More Button Spinner Needs ARIA Hidden & Busy
**Learning:** Decorative elements inside loading buttons (like spinning circles or arrows) can cause screen readers to announce confusing extraneous information or misinterpret async progress.
**Action:** Always add `aria-hidden="true"` to purely decorative SVGs, spans, or icons within buttons, and explicitly use `aria-busy={loading}` on the button container when an asynchronous action is pending.
## 2026-10-26 - Missing Context on Icon-only Star Buttons in Email App
**Learning:** Found that the "star" toggle buttons in the email app (`apps/studio/app/email/page.tsx`) were using a raw text character (★) without any `aria-label` or `aria-hidden` attributes. This causes screen readers to read "Black star" without any context on what the button actually does (i.e., marking an email as important).
**Action:** Always add dynamic `aria-label`s to icon-only buttons (e.g. `aria-label={isStarred ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}`) and wrap the decorative icon (like ★) in a `<span aria-hidden="true">` to improve accessibility and provide clear context for screen reader users.

## 2024-10-26 - Ngăn chặn screen reader đọc icon trang trí và text cũ khi loading
**Learning:** Khi một button chuyển sang trạng thái loading, nó thường làm hai việc: thay thế nội dung text bằng text báo trạng thái (ví dụ "Đang tải...") và vô hiệu hóa button (disabled). Tuy nhiên, nếu nút có chứa các ký tự/icon trang trí (như →, ↓, ✨) mà không có `aria-hidden="true"`, screen reader vẫn có thể đọc chúng hoặc đọc nội dung cũ nếu không được xử lý cẩn thận, gây nhiễu cho người khiếm thị. Ngoài ra, việc thiếu `aria-busy="true"` khiến các công cụ hỗ trợ không nhận diện rõ trạng thái loading.
**Action:** Khi tạo loading button: 1) Luôn thêm `aria-busy={loading}`, 2) Wrap tất cả các icon trang trí (arrow, emoji) trong `<span aria-hidden="true">`, 3) Cân nhắc thiết kế loading state sao cho screen reader không bị nhầm lẫn giữa text cũ và text mới.
## 2024-10-29 - Theme Switcher Accessibility
**Learning:** Icon-only buttons or buttons that hide their text label on smaller viewports (`hidden sm:inline`) lack an accessible name for screen readers on mobile devices.
**Action:** Always provide an `aria-label` that explicitly describes the button's action (e.g., `aria-label="Giao diện Tối Obsidian"`) if the text label might be visually hidden via responsive CSS classes.
