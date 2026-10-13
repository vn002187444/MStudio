# MStudio Channel PLAN

> Single source of truth cho Human Lead, OpenCode CLI, Command Code CLI và Google Jules.

## Hard requirements
- Brand: MStudio Channel.
- Web: Next.js + TypeScript, App Router-first.
- Infrastructure: Cloudflare-first, Free-tier-first.
- Evidence-first, human-controlled publishing.
- Không đưa crawling hoặc model call vào reader request path.
- Gemini chỉ qua ModelGateway.
- Article phải truy ngược được Story -> Fact/Claim -> StorySource -> RawItem/Source.

## Product loop
`Collect -> Normalize -> Cluster -> Verify -> Synthesize -> Review -> Publish -> Discover -> Learn`

Không dùng mô hình `một nguồn -> paraphrase -> auto-publish`.

## Information Architecture
Main nav: Mới nhất | Dành cho bạn | Đang nóng | Thế giới | Công nghệ | AI Channel | Giải trí | Khám phá | Đời sống | Góc Tối

Taxonomy:
- Thế giới: Mỹ, Châu Âu, Trung Quốc, Hong Kong, Đài Loan, Nhật Bản, Nga, Đông Nam Á, Campuchia, Lào, Ấn Độ, Châu Mỹ Latin.
- Công nghệ: AI, Internet, Startup, Open Source, Blockchain, Crypto.
- AI Channel: Tin AI, Models, Agents, Research, Developer, GitHub Trending, Công cụ AI, Cộng đồng.
- Giải trí: Ngôi sao, Âm nhạc, Điện ảnh, Showbiz, Scandal.
- Khám phá: Chuyện lạ, Kỳ án, Ký sự, Hồ sơ, Bí ẩn, Lịch sử.
- Đời sống: Tâm sự, Kỹ năng sống, Gia đình, Sức khỏe, Du lịch.
- Góc Tối: Kỳ án, Hồ sơ, Ký sự, Dark History.

## UI/UX specification
### Brand
Black & White editorial. 85-90% diện tích monochrome, accent dùng có chủ đích.
breaking-red chỉ cho breaking/urgent editorial state thực sự. Đang nóng là trending/ranking state, mặc định monochrome. Không dùng màu đỏ chỉ để tăng CTR.

```css
--black:#090909;
--ink:#101114;
--white:#FFFFFF;
--off-white:#F6F6F4;
--soft:#F6F7F9;
--gray:#667085;
--border:#E3E3E3;
--ink-700:#3A3A3A;
--ink-800:#2A2A2A;
--ink-900:#1C1C1C;
--ai-blue:#2563EB;
--breaking-red:#D92D20;
--crypto-green:#16A36A;
--entertainment-purple:#8B5CF6;
```

### Typography / grid
- Triết lý giao diện: **Editorial News × Minimal Data UI** (chuẩn mực thông tin Reuters/Bloomberg kết hợp trải nghiệm đọc cao cấp từ Awwwards Magazine/Publication showcases, theo nghiên cứu thiết kế TinFlow trong `Demo/`).
- 90% diện tích monochrome/neutral, accent chỉ dùng cho Breaking, Live, Active state và CTA quan trọng.
- Font chính: **Inter** (Fallback: `Inter, Arial, Helvetica, sans-serif`).
- Spacing system: baseline 4px, nhịp chính theo 8px: `4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96 px`.
  - Icon ↔ text: 8px.
  - Metadata gap: 8–12px.
  - Nội dung trong card: 16–20px.
  - Khoảng cách giữa các card: 24px.
  - Section nhỏ: 32–40px; Section lớn: 56–64px; Hero → section kế: 48–64px.

#### Responsive Grid System (Material Design 3 Breakpoints)
- **Desktop (≥ 1200px - Large/Extra-large):**
  - Max content width: 1280px
  - 12 columns, Gutter: 24px, Outer padding: 32px
  - Main article column: 8 columns (~680–760px prose) | Sidebar: 4 columns
- **Tablet (840–1199px - Expanded):**
  - 12 columns, Gutter: 24px, Padding: 24px
  - Sidebar ngữ cảnh, linh hoạt chuyển xuống dưới content khi cần.
- **Medium (600–839px):**
  - 8 columns, Gutter: 24px, Padding: 24px
  - Layout 1 pane rộng hoặc card chia 2 cột.
- **Mobile (< 600px - Compact):**
  - 4 columns, Gutter: 16px, Page padding: 16px
  - Chuyển toàn bộ về single column, tối ưu thao tác 1 tay và nhịp đọc lướt.

#### Type scale chuẩn
| Token | Desktop | Mobile | Weight | Line height | Ghi chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 56px | 40px | 700 | 1.05 | Headline đặc biệt / trang chuyên đề |
| **H1** | 44px | 32px | 700 | 1.1 | Tiêu đề bài viết chính (Article H1) |
| **H2** | 32px | 26px | 700 | 1.18 | Tiêu đề Section / Lead story listing |
| **H3** | 24px | 21px | 650–700 | 1.25 | Tiêu đề khối / sub-heading |
| **Card title** | 18px | 17px | 650 | 1.3 | Tiêu đề thẻ tin tức |
| **Article body**| 18px | 17px | 400 | 1.65 | Nội dung đọc văn bản (prose) |
| **UI / Body** | 16px | 16px | 400–500 | 1.5 | Chữ giao diện, nút bấm, menu |
| **Meta** | 14px | 13–14px | 400–500 | 1.4 | Thời gian, tác giả, tag, nguồn |
| **Label** | 12px | 12px | 600 | 1.3 | Pill chuyên mục, badge trạng thái |

#### Article reading column
- Chiều rộng prose reading: 680–760px (giữ độ dài dòng 60–75 ký tự tối ưu cho mắt).
- Paragraph spacing: 20–24px.
- Summary box: full width của reading column.

### Layout primitives & Design tokens
```css
--container: 1280px;
--gutter: 24px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;

--z-base: 0;
--z-raised: 10;
--z-sticky: 50;
--z-overlay: 100;
--z-modal: 200;
--header-offset: 72px;

--bg: #FFFFFF;
--surface: #F7F8FA;
--text-primary: #101114;
--text-secondary: #5F636B;
--border: #E3E5E8;
--brand: #155EEF;
--brand-hover: #0B4DD8;
--breaking: #D92D20;
--success: #16803A;
--warning: #B54708;
```
Component dùng z-index theo vai trò (semantic), không ghi số trực tiếp. `--header-offset` phụ thuộc breakpoint (desktop 72px / mobile 56px).

### Component system (Blueprint TinFlow từ Demo)
1. **Lead Story Card (Hero):**
   - Tỉ lệ ảnh desktop: 16:9 hoặc 3:2, bo góc nhẹ `--radius-md`.
   - Category / Live pill nổi bật.
   - Tiêu đề H1/H2 rõ nét.
   - Dek / Summary 2–3 dòng trong listing.
   - USP badge: `◎ Tổng hợp từ X nguồn tin · thời gian`.
   - Nút Call-to-action: "Xem chi tiết →".
2. **Standard News Card:**
   - Thumbnail 120–180px desktop tùy grid (tỉ lệ 1:1 hoặc 16:9).
   - Card title 17–18px, tóm tắt 1–2 dòng.
   - Meta 13–14px (số nguồn tin + thời gian + pill danh mục).
   - Không dùng shadow nặng; sử dụng divider hoặc border viền mỏng `#E3E5E8`.
3. **Source / Trust Element (USP Cốt lõi):**
   - Badge: `◎ Được tổng hợp từ X nguồn tin uy tín · [Thời gian]` kèm logo/avatar các nguồn báo chí (Reuters, BBC, The Verge, VnExpress...).
   - Hỗ trợ popover/drawer mở danh sách nguồn khi click số nguồn.
4. **AI Quick Summary Box:**
   - Khối bo góc viền nhẹ, nền `--surface`, icon AI tinh tế.
   - Tóm tắt 3–4 bullet points sự thật cốt lõi (Key Facts) trước bài đọc dài.
5. **Event Timeline & Context Block:**
   - Dòng thời gian mốc giờ/ngày biểu diễn trực quan diễn biến sự kiện.
6. **Consensus vs Conflict Block (Một câu chuyện, nhiều góc nhìn):**
   - Phân tách rõ ràng:
     - **Đã xác nhận (Consensus):** Các điểm được đa số nguồn tin đồng thuận.
     - **Chưa thống nhất (Discrepancy):** Đối chiếu trực tiếp sự khác biệt giữa Source A và Source B.
7. **Nguồn tham khảo (Source Citations):**
   - Danh sách đánh số thứ tự minh bạch kèm mốc thời gian xuất bản và link ngoại dẫn trực tiếp về bài gốc.

### Bố cục các trang (Page Blueprints)

#### 1. Trang chủ (Homepage)
- **Header (64–72px desktop / 56px mobile):** Sticky header với hiệu ứng kính mờ (frosted glass), Logo MSTUDIO CHANNEL (giữ nguyên brand mark và font styling hiện tại: "MSTUDIO <span>CHANNEL</span>"), Main Nav 1 dòng, Ô tìm kiếm tinh tế (Search bar), và icon User/Action.
- **Trending Strip:** Dải từ khóa và chuyên mục đang nóng ngay dưới header.
- **Hero Grid (12 cột):**
  - Cột lớn (8 cột): Lead Story tin nổi bật nhất (ảnh lớn 16:9 + headline + summary + source count + CTA).
  - Cột phụ (4 cột): 2–3 tin thứ cấp quan trọng.
- **Tin nổi bật (Featured Strip):** Hàng 4 card ngang (thumbnail 16:9 + title + số nguồn + thời gian).
- **Home Columns (2 cột):**
  - Cột chính (8 cột): Main Feed tin mới nhất dạng card danh sách có thumbnail.
  - Cột bên (4 cột): Sidebar gồm Chủ đề đang quan tâm (hashtags #), Hộp đăng ký Bản tin Email, Kênh mạng xã hội theo dõi.
- **Footer:** Chân trang biên tập chuẩn mực, sitemap link và thông tin pháp lý/bản quyền.

#### 2. Trang bài viết (Article Page)
- Breadcrumb: `Trang chủ > [Chuyên mục] > [Tiêu đề]`
- Category tag & thời gian cập nhật.
- H1 Headline (44px desktop / 32px mobile) + Dek tóm tắt.
- Source Trust Badge: `◎ Được tổng hợp từ X nguồn tin uy tín` kèm icons các tòa soạn.
- Hero Image (16:9) kèm caption/credit bản quyền.
- **AI Quick Summary:** Khối tóm tắt nhanh các điểm chính (Key Takeaways).
- **Prose Content (680–760px):** Thân bài chuẩn typography, quote block nổi bật, internal links tự nhiên.
- **Khối sự kiện (Timeline):** Diễn biến theo thời gian.
- **Khối đối chiếu nguồn tin:** Phân tích điểm đồng thuận & sai biệt giữa các nguồn.
- **Danh sách nguồn tham khảo:** Đánh số 1..N kèm link gốc.
- **Right Rail (Desktop):** Sticky Table of Contents (ToC) + Thẻ tin liên quan (thumbnails) + Chủ đề liên quan (#tag) + Nút chia sẻ & sao chép liên kết.

#### 3. Trang Chủ đề / Thực thể (Auto Topic & Entity Page)
- Header chủ đề: #Hashtag, mô tả tóm tắt, nút "Theo dõi" (Follow).
- Stats Bar: Số bài viết | Số nguồn tin | Chỉ số xu hướng.
- Tabs điều hướng: `Tổng quan | Tin tức | Dòng thời gian | Liên quan`.
- Dòng thời gian (Timeline mốc sự kiện).
- Key Developments (Bước ngoặt quan trọng).
- Liên kết thực thể: Related People (Chuyên gia/Nhân vật liên quan) & Related Organizations (Tổ chức/Doanh nghiệp liên quan).

#### 4. Giao diện Mobile App-like & PWA (Bản cài đặt ứng dụng di động)
- **Bản cài đặt Mobile (PWA - Progressive Web App):**
  - Cấu hình `manifest.webmanifest`: tên ứng dụng `MStudio Channel`, `display: standalone`, `theme_color: #090909`, `background_color: #ffffff`, hỗ trợ icon chuẩn iOS/Android (192x192, 512x512 maskable, apple-touch-icon).
  - Tích hợp Service Worker với chiến lược Stale-While-Revalidate cho static assets và lưu bài đọc ngoại tuyến (Offline reading).
  - Prompt mời cài đặt ứng dụng nhẹ nhàng: "Thêm MStudio Channel vào Màn hình chính".
- **Trải nghiệm giao diện chuẩn App (App-like UX):**
  - **iOS-style Bottom Tab Bar:** Thanh điều hướng cố định sát đáy màn hình gồm 4 tab (`Trang chủ`, `Khám phá/Chủ đề`, `Tìm kiếm`, `Đã lưu/Menu`), hiệu ứng kính mờ `backdrop-filter: blur(16px)`, đường viền mỏng hairline `0.5px`, phản hồi xúc giác nhẹ khi chạm.
  - **Safe Area Insets:** Xử lý triệt để tai thỏ / Dynamic Island và thanh gạt Home Indicator (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
  - **Bottom Sheet Drawer (iOS Sheet):** Khi click vào "Số nguồn tin", "Chia sẻ" hoặc "Bộ lọc", mở Bottom Sheet trượt vuốt từ đáy màn hình với góc bo cong tự nhiên thay vì modal desktop thô cứng.
  - **Pull-to-Refresh:** Kéo vuốt từ đỉnh trang xuống để nạp lại dữ liệu với spinner tròn đàn hồi phong cách iOS Safari.
  - **Haptic Touch Feedback:** Rung nhẹ (`navigator.vibrate(8)`) khi độc giả nhấn lưu bài, chuyển tab hoặc sao chép liên kết.
  - **Horizontal Category Swipe:** Trượt vuốt ngang chuyển nhanh qua lại giữa các tab chuyên mục tin tức.

### Free Plugins & Public APIs cho Newsroom ($0 chi phí, tối ưu Cloudflare Free Tier)
1. **Widget Thời tiết (Weather API):**
   - **Open-Meteo API** (Hoàn toàn 100% Free, mã nguồn mở, không cần API Key, không giới hạn rate-limit gắt gao, độ trễ thấp, hỗ trợ tọa độ mọi tỉnh thành Việt Nam / thế giới). Hiển thị nhiệt độ, thời tiết trên thanh header hoặc sidebar.
2. **Thanh Ticker Tài chính & Thị trường (Financial / Crypto Bar):**
   - **CoinGecko Free API** (BTC, ETH, SOL, top 10 crypto theo thời gian thực - Free 30 req/min, lưu cache Cloudflare KV 60s phục vụ hàng triệu độc giả với 0 cost).
   - **TradingView Free Embed Widget** (Widget biểu đồ tài chính tương tác chuyên nghiệp cho chuyên mục Kinh doanh / Công nghệ / Crypto).
3. **Nghe đọc bài báo thông minh (Text-to-Speech):**
   - **Web Speech API native (`window.speechSynthesis`):** Tận dụng giọng đọc tiếng Việt chất lượng cao tích hợp sẵn trên trình duyệt (Chrome, Safari, iOS voice). **Chi phí $0, không tốn tài nguyên server/AI, 0ms backend latency!**
4. **Tiện ích Độc giả & Chia sẻ:**
   - **Local Bookmarks:** Lưu bài viết đọc sau bằng `localStorage` / `IndexedDB` ngay trên trình duyệt (bảo mật riêng tư độc giả, $0 chi phí database).
   - **Native Web Share API (`navigator.share`):** Mở bảng chia sẻ hệ thống của iOS/Android với 1 chạm.
   - **Thời gian đọc (Reading Time) & Mục lục tự động (Auto ToC):** Tự động tính thời gian đọc dựa trên độ dài bài viết.
5. **Đo lường & Phân tích:**
   - **Cloudflare Web Analytics:** Miễn phí 100%, bảo mật quyền riêng tư không dùng cookie, siêu nhẹ, tích hợp trực tiếp qua Cloudflare Edge.

### Vertical DNA
- Core News: monochrome editorial, thông tin dày dặn.
- AI Channel: monochrome + blue/data cues, cập nhật model/benchmark.
- Entertainment: image-driven magazine composition, media-forward.
- Crypto / Kinh doanh: data-friendly, green accent, biểu đồ thị trường.
- Góc Tối: restrained documentary, tư liệu lịch sử/hồ sơ, không giật gân.
- Tâm sự / Đời sống: whitespace-heavy, reading-first.

Tất cả sử dụng chung tokens, accessibility (WCAG 2.2 AA) và navigation system.

### Motion & Interaction Engine (Big-Tech Cues: Apple / Linear / Vercel standard)

Hệ thống chuyển động ưu tiên độ mượt mà 60fps/120fps (ProMotion display), phản hồi xúc giác đàn hồi (Spring physics) và tính tinh tế chuẩn Apple & Linear:

```css
--motion-duration-instant: 80ms;
--motion-duration-fast: 150ms;
--motion-duration-base: 250ms;
--motion-duration-slow: 400ms;
--motion-spring-apple: cubic-bezier(0.32, 0.72, 0, 1);
--motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

#### Page Loading & Navigation Transitions (Mượt mà như iOS)
1. **Slim Route Loading Bar (Thanh tải trang mỏng):**
   - Thanh tiến trình mỏng 2px ở đỉnh màn hình (như Safari / YouTube), chạy hiệu ứng gradient mượt mà khi bắt đầu nạp route mới, biến mất nhẹ nhàng khi nạp xong.
2. **Reading Progress Bar (Thanh tiến trình đọc bài):**
   - Thanh dính sát đỉnh header hiển thị % cuộn bài viết, giúp độc giả kiểm soát nhịp đọc bài.
3. **View Transitions API (`document.startViewTransition`):**
   - Tận dụng chuẩn View Transitions API hiện đại: khi nhấp vào tin tức, thẻ tin và ảnh thumbnail chuyển cảnh (morph & fade) êm ái sang bài viết, loại bỏ hoàn toàn hiện tượng chớp trắng trang hoặc nhảy giật layout.
4. **Pull-to-Refresh Gesture:**
   - Kéo vuốt đàn hồi với icon xoay tròn kiểu iOS Safari trên thiết bị di động, tự động refresh dữ liệu mới nhất.

#### Big-Tech Visual Cues (Viền, Hiệu ứng nổi, Hộp thông tin)
- **Hairline Borders & Surface Treatment:**
  - Viền mỏng 1px với màu bán trong suốt `rgba(0, 0, 0, 0.08)` trên nền sáng và `rgba(255, 255, 255, 0.1)` trên nền tối; 0.5px hairline trên màn hình Retina.
  - Sử dụng `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.7)` tạo đường viền cạnh trên tinh xảo chuẩn Apple hardware.
- **Frosted Glass (Kính mờ cao cấp):**
  - `backdrop-filter: blur(16px) saturate(180%)` cho Site Header, Bottom Navigation Bar và Quick Summary Box.
- **Micro-interactions:**
  - **Card Hover:** Card nâng nhẹ `translateY(-2px)` cùng viền sáng nhẹ; ảnh thumbnail phóng to vi mô `scale(1.02)` cắt gọn trong `overflow: hidden`.
  - **Tactile Active Press:** Nút bấm và card co nhẹ `scale(0.98)` khi chạm ngón tay/click chuột tạo cảm giác xúc giác cơ học.
  - **Live Breathing Dot:** Chấm tròn phát sáng thở nhẹ nhàng cho tag Breaking / Live.

Rules:
- Motion must communicate hierarchy, feedback or state.
- Prefer transform/opacity for animated visual transitions (đảm bảo 60fps/120fps).
- Never use `transition: all`.
- Skeleton animation must not change layout geometry.
- Autoplay media must follow accessibility/editorial policy.

`prefers-reduced-motion: reduce`:
- Remove non-essential movement.
- Disable decorative transform/parallax transitions.
- Skeleton becomes static.
- State changes remain understandable without animation.
- Do not blindly disable essential feedback.
- Do not use a global `!important` kill-switch unless necessary.

### Visual effects / interaction language (v1)
Direction: quiet interaction. Hover/focus làm rõ khả năng tương tác, không biến newsroom thành landing page công nghệ. Restrained hơn các gallery hiệu ứng ngoài web: không 3D tilt, glow, glitch, parallax, shimmer trang trí.

```yaml
visual_effects_v1:

  navigation:
    hover: underline_or_ink_change
    active: persistent_indicator
    movement: none

  headline_link:
    hover: subtle_underline_or_color
    movement: none

  news_card:
    hover: subtle_surface_or_border_change
    translate: none_by_default
    shadow: none_or_minimal

  article_image:
    hover: none

  clickable_thumbnail:
    hover: subtle_image_scale
    max_scale: 1.02
    overflow: clipped

  button:
    hover: background_or_border_change
    active: subtle_press_feedback

  topic_chip:
    hover: foreground_background_inversion
    movement: none

  source_link:
    hover: underline
    movement: none

  breaking:
    accent: breaking-red
    animation: none_by_default

  trending:
    accent: monochrome
    animation: none
```

Explicitly cấm mặc định trong v1:
3D tilt, glow, neon border, cursor trail, magnetic cursor/button, glitch text, RGB split, infinite marquee chỉ để trang trí, Ken Burns decorative animation, aggressive card lifting, glassmorphism, autoplay decorative motion.

### Accessibility

Target: WCAG 2.2 AA.

- Normal text contrast >= 4.5:1.
- Large text contrast >= 3:1.
- WCAG pointer target minimum follows SC 2.5.8 (24x24 CSS px, có ngoại lệ spacing).
- MStudio preferred touch target = 44x44 CSS px for primary/mobile controls.
- Visible `:focus-visible`.
- Keyboard complete.
- Skip-to-content.
- Semantic landmarks/headings.
- Focus must not be hidden by sticky UI.
- Color is never the sole information signal.

### Frontend performance

Core Web Vitals at p75:
- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

Segmentation: mobile, desktop.

Rules:
- Reserve dimensions/aspect ratio for images, video and embeds.
- Skeleton preserves final-content geometry.
- Optimize the LCP media deliberately; hero/LCP image must not be casually lazy-loaded.
- Lazy-load appropriate below-fold media.
- Responsive images use correct sizing strategy.
- Avoid unnecessary client-side JavaScript.
- Third-party JS requires justification.
- No heavy animation library for trivial transitions.
- Performance regressions are acceptance failures for critical public surfaces.

### Language / theme

- Primary document language: Vietnamese (`lang="vi"`).
- `MStudio Channel` is a non-translatable brand name (`translate="no"` on brand surfaces).
- Use language metadata for significant foreign-language content where applicable.
- Dark mode is explicitly out of scope for v1.
- Agents must not add dark-theme architecture without an approved task.

## Media policy
Priority: primary/original có quyền rõ -> licensed/official -> approved public provider -> generated illustration nếu policy cho phép.

MediaAsset fields: origin_url, source, creator, rights_status, license, credit, caption, alt, width, height, asset_hash.

Không tự động rehost toàn bộ ảnh crawler. Unknown rights có thể block publication theo editorial policy.

## System architecture
```text
Users/Search/AI crawlers
        |
        v
Cloudflare DNS/CDN/WAF
        |
        v
Next.js Web + MStudio Studio
        |
        v
Hono API (workers/api) + job Workers
        |
        v
Repository layer
   /       |       \
 D1       R2        KV
  |
  v
Vectorize (selective semantics)

Sources -> Scheduler/Ingest Worker -> Queues
-> Normalize -> Deduplicate/Cluster
-> Evidence/Verification/Context
-> ModelGateway -> Gemini
-> Writer/SEO/Linking/QA-Risk
-> Studio Review
-> Publish Queue
-> D1/R2/cache/search/sitemaps/recommendation
```

## Backend stack (locked)
Khóa theo quyết định Human Lead. Đổi stack = sửa PLAN + human review, không sửa ngầm trong task.

```yaml
frontend:
  framework: Next.js
  language: TypeScript

backend:
  framework: Hono
  runtime: Cloudflare Workers
  language: TypeScript

database:
  primary: Cloudflare D1

storage:
  object: Cloudflare R2
  cache_config: Cloudflare KV

async:
  queue: Cloudflare Queues
  scheduler: Cloudflare Cron Triggers

semantic:
  vector: Cloudflare Vectorize

 ai:
   gateway: ModelGateway
   initial_provider: Gemini
   default_model: gemini-3.1-flash-lite (Human 10-10-2026, cho mọi tác vụ draft/summary/SEO/linking)
```

Rules:
- Mọi HTTP API cho Web/Studio đi qua `workers/api` (Hono). Job Workers (ingest/normalize/intelligence/media/publish) không expose HTTP public trực tiếp.
- Không thêm NestJS/Express: giữ BE nhỏ, gần Workers runtime, đúng mục tiêu Free-tier-first.
- TypeScript strict cho mọi Worker; types bindings sinh từ config (`wrangler types` hoặc tương đương), không hardcode shape của D1/R2/KV.

## Cloudflare Free-tier operating rules
Free-tier budget là functional requirement.

- Static/cache first.
- Không CPU-heavy parsing/embedding trong reader request.
- Một scheduler điều phối nhiều feeds; không tạo cron riêng cho mỗi feed.
- D1: indexed access patterns, pagination, explicit columns, tránh hot-path full scans.
- Raw HTML/media blob không lưu D1.
- Queue payload chỉ IDs + minimal metadata; artifacts lớn ở R2.
- Idempotency bắt buộc để retry không duplicate publish/write.
- R2 chỉ giữ assets cần thiết, dedupe bằng hash, số image variants hạn chế.
- Vectorize chỉ embed Story/Article/entity cần semantic operations, không mặc định mọi RawItem.
- Cheap filter trước semantic query.
- Analytics chỉ ghi events hữu ích: open_article, meaningful_read, follow_topic, hide_topic, share, save; sampling cho micro-interactions.
- UI không polling DB liên tục.
- CMS autosave phải debounce, không write mỗi keystroke.

QuotaGuard phải track: Workers requests, D1 reads/writes, Queue operations, R2 storage/ops, Vectorize dimensions, analytics events, model usage.

Modes: NORMAL -> WARN -> SAFE -> STOP. Khi thiếu quota, ưu tiên giảm crawl/reprocessing/embeddings/analytics/recommendation refresh trước; cố giữ cached published content hoạt động.

Threshold do Human Lead cấu hình theo quota/dashboard thực tế, không hardcode giả định.

## Next.js repository
```text
mstudio-channel/
├ apps/
│ ├ web/
│ │ ├ app/(public)/
│ │ ├ components/{article,cards,navigation,discovery,seo}/
│ │ └ lib/{content,seo,analytics}/
│ └ studio/
│   ├ app/{newsroom,content,sources,ai-desk,seo,audience,media,automation,settings}/
│   └ components/
├ workers/
│ ├ api/src/{index.ts,routes/,middleware/,handlers/}
│ └ {ingest,normalize,intelligence,media,publish}/
├ packages/
│ ├ ui/
│ ├ db/{schema,repositories,migrations}/
│ ├ contracts/
│ ├ taxonomy/
│ ├ ai/{model-gateway,agents,prompts,schemas}/
│ ├ seo/
│ ├ auth/
│ ├ observability/
│ └ config/
├ docs/
├ backlog.yaml
├ AGENTS.md
├ PLAN.md
├ package.json
└ pnpm-workspace.yaml
```

### Public routes
- `/`
- `/moi-nhat/`
- `/danh-cho-ban/`
- `/dang-nong/`
- `/the-gioi/[...slug]/`
- `/cong-nghe/[...slug]/`
- `/ai-channel/[...slug]/`
- `/giai-tri/[...slug]/`
- `/kham-pha/[...slug]/`
- `/doi-song/[...slug]/`
- `/goc-toi/[...slug]/`
- `/bai-viet/[slug]/`
- `/chu-de/[slug]/`
- `/nhan-vat/[slug]/`
- `/to-chuc/[slug]/`
- `/quoc-gia/[slug]/`
- `/search/`
- `/tac-gia/[slug]/`

### Next.js rules
App Router-first. Server Components mặc định cho content surfaces; Client Components chỉ interaction boundaries. Search/FYP dynamic; article/category/topic ưu tiên cacheable strategy theo freshness. Không hardcode deployment-specific API vào domain packages. Deployment adapter phải vượt compatibility gate trước khi khóa production.

## Core model
Source, Feed, RawItem, MediaAsset, StoryCluster, StorySource, Fact, Claim, Entity, Topic, Article, ArticleRevision, Citation, InternalLink, SEORecord, AgentRun, Job, User, EditorialDecision, ReaderEvent, ReaderProfile.

## AI workflow
Scout -> Cluster -> Evidence -> Verification -> Vietnam Context -> Writer -> SEO -> Linking -> QA/Risk -> Editorial Review.

AgentRun lưu story/job ID, type, prompt version, model/version, evidence/source refs, structured input/output, status/error, timestamps và reviewer disposition.

Publishing: INGESTED -> CLUSTERED -> RESEARCHING -> DRAFTED -> AI_QA -> HUMAN_REVIEW/AUTO_ELIGIBLE/HOLD -> SCHEDULED -> PUBLISHED -> UPDATED/CORRECTED/RETRACTED.

## CMS
Navigation: Overview; Newsroom (Incoming, Story Clusters, Research Desk, Drafts, Needs Review, Scheduled, Published, Corrections); Sources; AI Desk; SEO & Discovery; Audience; Media; Automation; Analytics; Settings.

Research Desk: `SOURCES | FACT/CLAIM MATRIX | INTELLIGENCE`.

Editor: main canvas (headline, dek, hero, summary, rich article, timeline/context, sources) + inspector (Content, Sources, SEO, Social, AI, History).

## SEO / Discovery
Manage: slug, canonical, SEO title, description, index/follow, OG, Article/NewsArticle metadata, author/publisher, dates, breadcrumbs, image metadata, internal relationships.

Machine endpoints: `/sitemap.xml`, `/sitemap-news.xml`, `/sitemap-articles-YYYY-MM.xml`, `/sitemap-categories.xml`, `/sitemap-topics.xml`, `/sitemap-entities.xml`, `/sitemap-authors.xml`, `/robots.txt`, `/feed.xml`, `/category/{slug}/feed.xml`.

Internal links: entity/topic extraction -> candidates -> relevance/rules -> contextual anchor -> approval/safe automation. Không keyword stuffing.

## Recommendation v1
Pools: Fresh, Trending, Followed Topics/Entities, Semantic Related, Editorial Picks, Continue Story.

Signals proposal: affinity, freshness, significance, source quality, novelty, diversity, editorial priority, negative feedback.

Guardrails: repetition caps, source diversity, Follow/Hide, “Vì sao tôi thấy tin này?”, degrade gracefully nếu semantic quota thấp, không tối ưu duy nhất dwell time.

## Agent ownership
- OpenCode CLI: frontend/product implementation, apps/web, Studio UI, packages/ui và rendering/SEO integration.
- Command Code CLI: Workers, D1/repositories/migrations, auth, observability, ModelGateway/backend AI contracts, QuotaGuard.
- Google Jules: async isolated tests/docs/bugfix/refactor/dependency PRs sau khi contracts ổn định.
- Human Lead: architecture, schema gates, editorial/risk policy, secrets, final review/merge.

## Skills policy
Trước khi code task nào, agent phải load skills liệt kê trong `backlog.yaml -> task_skills[<TASK-ID>]` bằng skill tool. Skills là bắt buộc, không optional.
- Frontend (OpenCode): `frontend-ui-engineering`, `ui-styling`, `fixing-accessibility`, `vercel-react-best-practices`, `nextjs-on-cloudflare`, `fixing-metadata`, `web-perf`, `web-design-guidelines`.
- Backend (Command Code): `workers-best-practices`, `wrangler`, `cloudflare`, `api-and-interface-design`, `observability-and-instrumentation`, `performance-optimization`.
- AI/Editorial: `agents-sdk`, `security-and-hardening`.
- Quality chung: `test-driven-development`, `code-review-and-quality`, `debugging-and-error-recovery`, `documentation-and-adrs`, `seo-audit`, `shipping-and-launch`.
- Map chi tiết từng task nằm ở `backlog.yaml` (top-level `task_skills`). Đổi skill của task = sửa `backlog.yaml`, không sửa rải rác trong docs.

## Coordination protocol
- Single writer: một module/path chỉ có một active owner.
- Contract freeze: consumer integration chỉ bắt đầu sau shared contract merge/freeze.
- Schema lock: một migration owner tại một thời điểm.
- Human review schema trước downstream integration.
- PR ghi Task ID, objective, changed paths, acceptance evidence, tests, quota impact, risks, follow-ups.

Handoff:
```yaml
status: done|blocked|partial
changed_paths: []
tests_run: []
contracts_changed: []
migrations: []
quota_impact: none|low|medium|high
risks: []
follow_ups: []
```

Conflict priority: Security/editorial safety > PLAN architecture > shared contracts > task acceptance > agent preference.

## Git
Protected main. Short-lived `feat/MST-xxx-<owner>` hoặc `fix/MST-xxx-<owner>` branches. Agent không force-push branch của agent khác. Human review trước merge.

## Observability
Track lineage: source_id -> raw_item_id -> story_id -> agent_run_id -> article/revision -> editorial_decision -> published_revision.

Monitor ingest failures, feed health, queue retries/lag, duplicate rate, AI failure, review backlog, publish failure, quota utilization, D1 read/write metrics, media usage, vector usage và crawl/indexability health. Không log full source/article payload nếu diagnosis không cần.

## Security / editorial controls
RBAC Admin/Editor/Reviewer/SEO/Analyst; audit sensitive changes; platform secret storage; source allow/deny; rate-limit sensitive APIs; prompt/version history; correction/retraction; media rights metadata; human gates cho sensitive claims/categories.

## Definition of Done
Acceptance pass; relevant tests/typecheck/lint pass; no secrets; no unrelated diff; migration reviewed; quota impact assessed; loading/empty/error UI states; observability/error handling cho background work; docs/contracts updated; Human review trước merge.

## 90-day delivery
Sprint 1 Foundation/RSS -> Sprint 2 Story Intelligence -> Sprint 3 AI Pipeline -> Sprint 4 Editorial/Publishing -> Sprint 5 Search/SEO -> Sprint 6 Personalization/Hardening -> beta/quota tuning buffer.

## Follow-up tasks (QA re-evaluation 2026-10-09)
Nối tiếp FU-01..FU-07 trong `QA_REPORT.md` §5. Mỗi task nhỏ, một owner, xong là đóng.

- **FU-08 .gitignore hardening** (owner: jules): thêm `.env*`, `*.pem`, `*.key` vào `.gitignore`; verify không có secret tracked. Acceptance: `git ls-files` sạch + fresh clone không lộ secret mẫu. Tests: secret-scan. Quota: none.
- **FU-10 Auth/RBAC backlog draft** (owner: commandcode, human_gate: editorial/architecture): draft task Worker auth (session, roles Admin/Editor/Reviewer/SEO/Analyst theo mục Security), rate-limit sensitive APIs, audit log. Acceptance: task YAML duyệt bởi Human. Không code khi chưa duyệt scope.
- **FU-11 Category expansion draft** (owner: human phân công sau draft): draft taxonomy mở rộng + migration + UI category template đi kèm. Acceptance: Human duyệt phạm vi trước khi tách MST task.
- **FU-12 Scheduler concurrency eval + ADR** (owner: commandcode, Human quyết): benchmark 3 phương án (tuần tự hiện tại / `Promise.all` / `allSettled`) trên ingest — đo D1 write contention, fetch burst, queue lag, quota impact; viết ADR chọn 1. Các nhánh `MST-007-perf` / `MST-123-optimize` giữ làm tham chiếu tới khi ADR xong. Acceptance: ADR merged + branch thua đóng.
- **FU-13 Deploy runbook** (owner: jules): doc chuẩn các bước `wrangler queue create mstudio-events`, deploy api/analytics, `d1 migrations apply 0001–0006`, verify `/healthz` + `/recommendations`. Acceptance: người khác làm theo runbook pass từ đầu tới cuối.
- **FU-14 CF credentials + deploy execution** (owner: human + commandcode): Human cấp credentials; cmdc chạy runbook FU-13 lên môi trường thật, báo cáo quota impact thực tế. Acceptance: API/analytics live, queue hoạt động, `/articles/:id` trả published article.
- **FU-16 Zod forms (APPROVED 10-10-2026, owner: opencode)**: chuẩn hóa validation form Studio/Web bằng Zod shared (tiếp nối `workers/api`). Acceptance: mọi form FE dùng schema Zod chung, test pass.
- **FU-17 Auto internal-link (APPROVED 10-10-2026, owner: commandcode)**: AI quét Entity/Topic DB, tự chèn contextual anchor khi sinh bài. Acceptance: bài xuất bản có internal links + không chèn vào tin loại trừ (nếu có).
- **FU-18 Category pha 2 rút gọn (APPROVED 10-10-2026)**: chỉ 4 mục — Kinh doanh, Sức khỏe, Giáo dục, Xe (bỏ Thể thao, Du lịch). MST-071 (cmdc) + MST-072 (opencode).

- **FU-19 Typography & Inter Font Integration** (owner: opencode, paths: `apps/web/**`, `packages/ui/**`): Tích hợp chuẩn font Inter qua `@fontsource/inter` / Next.js font, đồng bộ biến CSS `--font-sans` và type scale tokens (`--text-h1`, `--text-h2`, v.v.). Loại bỏ fallback font hệ thống thô. Acceptance: Inter font hiển thị đồng nhất trên mọi màn hình. Tests: font-render-smoke. Quota: none.
- **FU-20 Design System Tokens & Responsive Grid** (owner: opencode, paths: `packages/ui/**`, `apps/web/**`): Cập nhật `tokens.css` và `tokens.ts` theo hệ Material Design 3 (12/8/4 columns, gutter 24px/16px, container 1280px, spacing rhythm 8px). Bổ sung color tokens (`--surface`, `--border`, `--brand`). Acceptance: typecheck và test tokens pass. Quota: none.
- **FU-21 Editorial News Components** (owner: opencode, paths: `apps/web/components/**`, `packages/ui/**`): Xây dựng thư viện component UI chuẩn theo mockups Demo: `LeadStoryCard`, `NewsCard` (hỗ trợ ảnh đại diện 16:9 & 1:1), `SourceTrustBadge` (USP số nguồn + logo tòa soạn), `QuickSummaryBox`, `TimelineBlock`, `ConsensusConflictBlock`, `SourcesListBlock`. Acceptance: WCAG 2.2 AA, responsive, loading/empty state. Quota: low.
- **FU-22 Homepage Rebuild theo TinFlow Wireframe** (owner: opencode, paths: `apps/web/app/(public)/page.tsx`): Nâng cấp trang chủ từ danh sách text thô sang bố cục đầy đủ: Header 64-72px + Trending Strip + 12-col Hero Grid (Lead story + 2-3 tin thứ cấp) + Dãy 4 card "Tin nổi bật" + Main Feed & Sidebar (Hashtags # chủ đề hot, Hộp nhận bản tin Email, Social links). Acceptance: bố cục khớp wireframe `Demo/to_wireframe_giao_din_webs.png`. Quota: low.
- **FU-23 Article Page Rebuild theo High-Fi Spec** (owner: opencode, paths: `apps/web/app/(public)/bai-viet/[slug]/**`): Nâng cấp trang bài viết đạt chuẩn reading column 680–760px, tích hợp Source Trust Pill với logo nguồn, Hero 16:9, AI Quick Summary box, Timeline sự kiện, Khối đối chiếu đồng thuận/bất đồng (Consensus vs Conflict), Danh sách nguồn đánh số thứ tự truy xuất link gốc, Sticky ToC & Related sidebar. Acceptance: đạt chuẩn mockup `Demo/to_ui_ux_cho_trang_web_5.png`. Quota: low.
- **FU-24 Auto Topic & Entity Pages Upgrade** (owner: opencode + commandcode, paths: `apps/web/app/(public)/chu-de/**`, `apps/web/app/(public)/to-chuc/**`, `apps/web/app/(public)/nhan-vat/**`): Nâng cấp trang chủ đề với Header Topic (#hashtag, Stats bài viết/nguồn tin/xu hướng, nút Theo dõi), Timeline cập nhật theo mốc thời gian, Key developments, liên kết thực thể Người & Tổ chức liên quan. Acceptance: UI khớp mockup Auto Topic Page (`Demo/to_ui_ux_cho_trang_web_7.png`). Quota: low.
- **FU-25 PWA & Mobile App-like Shell** (owner: opencode, paths: `apps/web/**`): Cài đặt PWA Manifest (`manifest.webmanifest`), Service Worker Stale-While-Revalidate (offline reading), thanh điều hướng Bottom Tab Bar phong cách iOS (Trang chủ, Khám phá, Tìm kiếm, Đã lưu), xử lý Safe Area Insets (`env(safe-area-inset-*)`), Bottom Sheet Drawer cho danh sách nguồn/chia sẻ, và Pull-to-refresh. Acceptance: Lighthouse PWA pass, trải nghiệm cảm ứng app-like mượt mà trên iPhone/Android. Quota: none.
- **FU-26 Free Utilities & Widgets Integration** (owner: opencode + commandcode, paths: `apps/web/**`, `workers/**`): Tích hợp widget Thời tiết (Open-Meteo API $0), thanh Ticker Crypto/Tài chính (CoinGecko free API cached Cloudflare KV 60s), tính năng Nghe đọc bài báo (Web Speech API tiếng Việt $0 cost), Bookmark cục bộ trên thiết bị và nút chia sẻ Native Web Share API. Acceptance: hoạt động mượt mà, không phát sinh chi phí hoặc quota server. Quota: low.
- **FU-27 Big-Tech Micro-interactions & Smooth Transitions** (owner: opencode, paths: `apps/web/**`, `packages/ui/**`): Xây dựng thanh nạp trang mỏng Slim Route Loading Bar (2px), thanh tiến trình đọc bài Reading Progress Bar, hiệu ứng chuyển trang View Transitions API không giật cục, Hairline borders, Frosted glass, Tactile press feedback (`scale(0.98)`) và Card micro-hover. Acceptance: 60/120fps chuyển động mượt mà như iPhone. Quota: none.
- **FU-28 SEO / GEO / AEO Full Optimization Engine** (owner: commandcode + opencode, paths: `packages/seo/**`, `apps/web/**`, `packages/contracts/**`): Gắn trực tiếp thẻ JSON-LD `NewsArticle` và `BreadcrumbList` vào `bai-viet/[slug]`, tích hợp `SpeakableSpecification` (cho Google Assistant / AI Overviews đọc đoạn Quick Summary), triển khai endpoint `llms.txt` và `llms-full.txt` (chuẩn trích xuất cho Perplexity, ChatGPT, Claude), chuẩn hóa Canonical URL, OpenGraph Article metadata, và chuyển đổi URL sang Semantic Slugs. Acceptance: Google Rich Results test pass, Perplexity/LLM indexing sạch sẽ, 100% SEO score. Quota: none.
- **FU-29 Modern Studio CMS & Quality UX Rebuild** (owner: opencode + commandcode, paths: `apps/studio/**`, `workers/api/**`, `packages/contracts/**`): Nâng cấp Studio CMS theo chuẩn tòa soạn hiện đại bám sát giao diện mới:
  1. Quality Score Radar Dashboard (82/100 điểm với 5 tín hiệu Accuracy, Source Coverage, Originality, Readability, Risk + 3 ngưỡng tự động: <70 Reject, 70-84 Review, >85 Auto Publish theo mockup Demo).
  2. Admin Dashboard & Pipeline Funnel trực quan (`RSS -> Cluster -> AI -> Review -> Publish`) kèm thống kê Throughput 24h.
  3. Editor Canvas mở rộng Full Blocks: Quick Summary, Timeline sự kiện, Đối chiếu Đã xác nhận vs Chưa thống nhất, Trình quản lý nguồn và logo tòa soạn.
  4. Live Preview 1:1 thời gian thực chuẩn giao diện độc giả (khung iPhone / Desktop).
  5. Autosave Debounce & Persistence API kết nối trực tiếp DB D1. Acceptance: CMS vận hành trơn tru, bám sát 100% giao diện độc giả. Quota: low.
- **FU-30 Schema, CMS & Web Alignment (D1 Migration 0013: SEO, Media & Taxonomy Columns)** (owner: commandcode + opencode, paths: `packages/db/**`, `packages/contracts/**`, `workers/api/**`, `apps/studio/**`, `apps/web/**`):
  Khắc phục triệt để gap lớn giữa DB Schema, CMS Editor và Web Render:
  1. D1 Migration 0013: Thêm các cột cốt lõi vào bảng `articles`: `slug` (UNIQUE), `category_slug` (FK categories), `hero_image_url`, `video_url`, `meta_title`, `meta_description`, `canonical_url`, `og_image_url`, `keywords`, `source_count`, `quality_score`, `is_breaking`, `is_trending`.
  2. Contracts & API: Cập nhật `ArticleRecord`, API `GET /articles` hỗ trợ query theo `category` và trả về đầy đủ ảnh, video, nguồn thật, slug; `GET /articles/:slug` tìm theo slug hoặc id.
  3. Studio CMS Editor: Nối toàn bộ form SEO Inspector (slug, meta title/description, canonical, keywords, category picker, hero image/video URL) vào luồng lưu bài thực tế.
  4. Web Render: Chuyển đổi định tuyến bài viết sang Semantic Slug, nhúng đầy đủ OpenGraph Article, Canonical tag, JSON-LD và render ảnh/video thật từ DB. Acceptance: D1 migration pass, CMS lưu đủ 100% SEO metadata, Web hiển thị ảnh, video và slug chuẩn. Quota: low.

## Production Operation & Go-Live Architecture (Quy chuẩn vận hành thực tế)

### 1. Phân bổ Free Models cho OpenCode CLI & Command Code CLI
- **OpenCode CLI (Frontend & UI):** Sử dụng các models miễn phí mới nhất qua OpenCode Zen / Go catalog:
  - Ưu tiên: `qwen-2.5-coder-32b` hoặc `deepseek-v3` cho các tác vụ viết code UI, TypeScript React, CSS và xử lý layout.
  - Fallback khi chạm rate-limit: chuyển đổi sang `gemini-2.5-flash` hoặc `gpt-4o-mini` free.
- **Command Code CLI (Backend & Data):**
  - Ưu tiên: `gemini-2.5-flash` (Google AI Studio Free Tier: 15 RPM, 1.500 RPD, 1 triệu token/phút).

### 2. Định mức Cloudflare Workers AI (Free Tier 10.000 neurons/ngày) vs Gemini Flash
- **Quy đổi định mức:**
  - 1 neuron ≈ 0.8 – 1.2 tokens (với model 8B như Llama 3.1 8B). Hạn mức 10.000 neurons/ngày tương đương **8.000 – 12.000 tokens/ngày**.
  - Đối với Llama 3.3 70B: 10.000 neurons chỉ chạy được khoảng **1.500 – 2.000 tokens** (chỉ đủ cho 1–2 bài viết là cạn kiệt quota ngày).
- **Chiến lược Hybrid tối ưu:**
  - **Không dùng Workers AI để gánh toàn bộ việc tìm và viết bài** vì sẽ cạn quota ngay sau vài bài.
  - **Phân công Workers AI (@cf/meta/llama-3.1-8b-instruct):** Chuyên trách các tác vụ nhẹ & nhanh tại Edge (phân loại Category, trích xuất Entity, chấm điểm spam/risk).
  - **Phân công Gemini 2.5 Flash API (1.500 req/ngày Free):** Làm Động cơ chính (Primary Engine) tổng hợp tin đa nguồn, viết bài, fact-check và sinh Quick Summary.
  - **Cơ chế Fallback:** Khi Gemini gặp lỗi 429/timeout thì chuyển hướng sang Cloudflare Workers AI hoặc OpenCode Zen DeepSeek.

### 3. Tận dụng Google Jules (Gemini Pro) cho các Task Phức Tạp
- Google Jules được trang bị Gemini Pro mạnh mẽ, được giao phụ trách các module kiến trúc phức tạp và cô lập:
  - Thiết kế pipeline tải ảnh Hotlink về R2 và trích xuất Video nhúng.
  - Xây dựng hệ thống phân mảnh Worker Queue chống timeout runtime.
  - Xây dựng bộ test suite hồi quy E2E cho SEO/GEO/AEO và kiểm thử tải.

### 4. Đảm bảo 100% Chuyên mục con đều có bài viết
- Bổ sung Seed Feeds đa dạng cho đầy đủ 10 chuyên mục chính và các chuyên mục con (Thế giới, Công nghệ, AI, Giải trí, Khám phá, Đời sống, Góc Tối, v.v.).
- API `GET /articles` hỗ trợ lọc chuẩn theo `category`.
- Cơ chế Fallback hiển thị: Nếu một chuyên mục mới chưa kịp có bài riêng, tự động hiển thị các bài viết liên quan hoặc bài mới nhất có gắn tag tương đồng, tuyệt đối không để trang danh mục bị trống (zero state).

### 5. Chia nhỏ Worker Runtime trên Cloudflare (Decoupled Pipeline)
- Cloudflare Workers Free Tier có CPU limit ngắn (50ms) và request wall-clock timeout ~30s. Tuyệt đối không gộp quá trình fetch, parse, gọi AI và tải media vào 1 worker duy nhất.
- **Kiến trúc 4 Workers phân mảnh qua Cloudflare Queues:**
  1. `workers/ingest`: Chỉ fetch RSS và đẩy ID vào queue `mstudio-ingest` (< 200ms).
  2. `workers/normalize`: Nhận queue, crawl HTML gốc, bóc tách text/ảnh/video, lưu D1 raw_items (< 1.5s/item).
  3. `workers/intelligence` & AI draft: Gọi Gemini Flash tóm tắt và sinh bài.
  4. `workers/media-processor`: Xử lý media nền (tải ảnh về R2, trích xuất video link).

### 6. Quản lý Media: 100% Bài có ảnh, Chống lỗi Hotlink bằng R2 & Nhúng Video
- **100% bài đăng có ảnh đại diện:**
  - Trích xuất `image_url` từ `og:image` hoặc ảnh đầu bài gốc.
  - **Rehost về R2:** Worker Media tải ảnh gốc lưu vào bucket Cloudflare R2 (`mstudio-media`) và phát qua CDN domain để triệt tiêu lỗi 403 Forbidden do trang gốc chặn hotlink.
  - **Fallback:** Nếu bài gốc hoàn toàn không có ảnh, sinh ảnh placeholder SVG gradient độc quyền của MStudio Channel.
- **Hỗ trợ Video bài đăng:**
  - Nếu bài gốc có video (YouTube, TikTok, video player iframe, direct mp4), trích xuất `video_url`.
  - Trên Frontend, render Player video responsive 16:9 và gắn badge "Video" nổi bật trên thẻ tin.

### 7. Engine Điều phối Bài đăng & Giữ chân Độc giả (Viewer Retention)
- Scheduler phân phối nhịp xuất bản bài đều đặn theo các khung giờ cao điểm (sáng, trưa, tối), không dồn cục một lúc.
- **Vòng lặp giữ chân độc giả:**
  - Auto Internal Linking giữa các thực thể và bài viết liên quan.
  - Khối "Tin liên quan theo dòng sự kiện" và gợi ý bài đọc tiếp theo dựa trên Story Cluster.
  - Thanh dải tin "Đang nóng" và "Dành cho bạn" cá nhân hóa trên thiết bị.

### 8. Loại bỏ hoàn toàn Mock Data (Go-Live với Dữ liệu Thật 100%)
- Loại bỏ toàn bộ text giữ chỗ tĩnh ("sẽ kích hoạt khi có bài").
- Lấy số lượng nguồn tin (`sourceCount`) thật từ bảng `story_sources` trong Database D1.
- Hiển thị mốc thời gian xuất bản thật (`publishedAt`) theo định dạng tương đối ("15 phút trước", "2 giờ trước").
- Mọi feed bài trên trang chủ và danh mục kết nối 100% với endpoint API thực tế.

## Sprint S08: CMS Stability Hotfix, 15m Auto-Publish Policy, iOS HIG Polish & Rank Math SEO Suite (13-10-2026)

### 1. Chính sách Tự động Hóa Biên tập & Xuất bản 15 Phút (15-Minute Editorial Grace Period Policy)
- **Quyết định Human Lead (13-10-2026):** Cho phép AI tự động viết bài từ các Story Cluster chất lượng cao và tự động xuất bản nếu sau **15 phút** ban biên tập không duyệt hoặc can thiệp.
- **Workflow phân tầng trạng thái:**
  1. `mstudio-intelligence`: Tự động gom cụm `incoming` -> sinh bản thảo AI qua Gemini Flash (`ModelGateway`).
  2. Tạo bản ghi `articles` với trạng thái `auto_eligible` (hoặc `human_review`) và ghi mốc thời gian `created_at`.
  3. Cửa sổ can thiệp 15 phút (15-Minute Grace Window): Ban biên tập có thể xem xét tại CMS `/newsroom/needs-review`, bấm Duyệt ngay (`scheduled` -> `published`), bấm Chỉnh sửa, hoặc bấm Giữ lại (`hold`) / Hủy bỏ (`retracted`).
  4. Nếu sau 15 phút (`created_at <= datetime('now', '-15 minutes')`) bài vẫn ở `auto_eligible` và không bị `hold`, Worker Scheduler tự động chuyển tiếp: `auto_eligible -> scheduled -> published`, sinh sitemap event và kích hoạt CDN purge cache.

### 2. Thiết kế Chuẩn Giao diện & Hiệu ứng iOS (Apple Human Interface Guidelines)
- **Visual Rhythm & Depth:**
  - Kính mờ siêu thực (Ultra Frosted Glass): `backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/5 dark:border-white/10`.
  - Bo góc liên tục (Continuous Corner Radius - Squircle): Sử dụng `rounded-2xl` (16px) và `rounded-3xl` (24px) thay vì góc nhọn thô cứng.
  - Phản hồi xúc giác & Vật lý khi chạm (Tactile Press Feedback): `active:scale-[0.98] transition-transform duration-150 ease-out` cho toàn bộ nút bấm, thẻ bài và hàng danh sách.
  - Bộ điều khiển phân đoạn (iOS Segmented Control): Tab chuyển đổi mượt mà với thanh trượt indicator phong cách iOS Safari.
  - Typographic Hierarchy: Nhịp typography dứt khoát theo SF Pro / Inter font metrics, đường viền siêu mảnh 1px hairline (`var(--border)`).

### 3. Bộ Công Cụ SEO Toàn Diện Kiểu Rank Math Pro
- **Real-Time On-Page SEO Scorer (0–100 điểm):**
  - Chấm điểm và đưa ra checklist 10 tiêu chí theo thời gian thực: Focus Keyword trong Title/Meta Desc/URL/Sapo/Heading H2, Keyword Density 1.0–2.5%, Độ dài bài viết, Điểm dễ đọc Readability (Flesch Score), Thẻ ALT hình ảnh, Internal Links.
- **Visual Schema Markup Generator:**
  - Trực quan hóa và cho phép chọn nhanh các kiểu Schema JSON-LD: `NewsArticle`, `Article`, `FAQPage`, `VideoObject`, `BreadcrumbList`.
- **Tích hợp Google Search Console (GSC) qua Service Account JSON:**
  - Sử dụng Google Service Account JSON lưu trữ an toàn trong Cloudflare Worker Secrets (`GSC_SERVICE_ACCOUNT_KEY`).
  - Cho phép đồng bộ headless không cần popup đăng nhập OAuth hết hạn, tự động kéo lượt click, hiển thị, CTR và vị trí từ khóa trung bình.
- **Quản lý Chuyển hướng 301/302 & Bắt lỗi 404 (Redirect Manager):**
  - Bảng D1 `redirects`: Tự động sinh redirect 301 khi biên tập viên thay đổi slug bài viết để bảo toàn thứ hạng Google.
  - Bắt lỗi 404 và tự động gợi ý đường dẫn bài viết tương đồng.
- **Image SEO:** Tự động tạo và điền `alt` text từ headline cho ảnh đại diện và ảnh trong bài viết.

### 4. Tối Ưu Hóa Toàn Diện Giao Diện Studio CMS Cho Thiết Bị Di Động (Mobile-First CMS UX / iOS Web Experience)
- **Kiến trúc Responsive & Điều hướng Mobile:**
  - Chuyển đổi thanh Sidebar máy tính cố định (`studio-nav.tsx`) thành **Bottom Navigation Bar** hoặc **iOS Slide-over Sheet/Drawer** khi màn hình `< 768px`.
  - Thiết kế mục tiêu chạm thân thiện với ngón tay cái (**Thumb-friendly touch targets**): tối thiểu 44×44px cho tất cả các nút bấm, hàng danh sách và icon điều hướng.
  - Header di động tối giản hiển thị tiêu đề trang, trạng thái kết nối backend và nút mở menu hoặc bộ lọc nhanh.
- **Trình biên tập & Duyệt bài tối ưu trên Mobile (`/editor` & `/newsroom`):**
  - **Floating Mobile Toolbar:** Thanh công cụ định dạng khối nằm nổi ngay trên bàn phím ảo hoặc mép dưới màn hình, không che khuất nội dung soạn thảo.
  - **Vuốt chạm xử lý nhanh (Swipe Gestures):** Cho phép vuốt sang phải để Duyệt ngay (`Accept / Publish`), vuốt sang trái để Giữ lại (`Hold`) hoặc Từ chối (`Reject`) trên danh sách Incoming và Cần duyệt (`/newsroom/needs-review`).
  - **Chế độ Mobile Preview tích hợp:** Cho phép biên tập viên xem trước giao diện bài viết trên khung mô phỏng di động (390px) trước khi xuất bản.
- **Bảng số liệu Audience & Bộ công cụ SEO thích ứng Mobile:**
  - Thẻ KPI cuộn ngang mượt mà (Horizontal Snap Scroll): Các ô Lượt xem, Đọc sâu, Tỷ lệ hoàn thành cuộn ngang êm ái trên màn hình nhỏ.
  - Chuyển đổi bảng dữ liệu dàn ngang (Desktop Tables) thành danh sách thẻ xếp tầng (Card-based list) trực quan, tránh lỗi vỡ khung hoặc thanh cuộn ngang khó chịu.
  - Bộ công cụ SEO Rank Math (On-Page Scorer, Schema, Redirects, GSC) hiển thị dạng Accordion / Tabs dễ dàng thao tác bằng một tay.
- **Trải nghiệm iOS Mobile Native:**
  - Hỗ trợ cử chỉ Kéo để làm mới (**Pull-to-Refresh**) trên các trang tin tươi Incoming, Cần duyệt và Audience.
  - Tương thích hoàn toàn vùng an toàn (**Safe Area Insets**): `padding-bottom: env(safe-area-inset-bottom)` cho iPhone tai thỏ / Dynamic Island.
  - Phản hồi rung vật lý nhẹ (`active:scale-[0.98]`) và hiệu ứng chuyển trang mượt mà không giật khựng (View Transitions).

### 5. Chiến Lược Preload & Tối Ưu Tốc Độ Tải Tức Thì (Instant-Load Preload Engine)
- **Critical Assets & Typography Preload:**
  - Preload phông chữ hệ thống (`Inter`, `SF Pro Display`) bằng `<link rel="preload" as="font" type="font/woff2" crossorigin>` trực tiếp trong thẻ `<head>`, loại bỏ 100% hiện tượng trễ phông (FOUT/FOIT) và đảm bảo CLS = 0.
- **Hero Image Preload (Tối ưu LCP < 800ms):**
  - Tự động phát hiện ảnh đại diện của bài tin chính (Lead story) trên Trang chủ và bài viết chi tiết để chèn `<link rel="preload" as="image" href="..." fetchpriority="high">`, đưa chỉ số LCP đạt mức xanh tuyệt đối trên Google PageSpeed.
- **Speculation Rules & Route Prefetching:**
  - Triển khai chuẩn W3C Speculation Rules API (`<script type="speculationrules">`) cho các đường dẫn bài viết hiển thị trong Viewport:
    - Khi người dùng cuộn đến hoặc lướt qua thẻ bài, trình duyệt tự động prefetch ngầm HTML và dữ liệu SSR.
    - Thời gian mở bài viết khi độc giả bấm click giảm về 0ms (Instant Navigation).
- **Cloudflare HTTP 103 Early Hints & Preconnect:**
  - Máy chủ Worker phát HTTP 103 Early Hints cho CSS bundle và phông chữ song song trong khi Worker xử lý truy vấn D1.
  - Khai báo `<link rel="preconnect" href="...">` tới CDN hình ảnh R2 và DNS-prefetch tới các nguồn tài nguyên ngoại vi.
- **AI Writing & SEO Metadata Enrichment (Luồng AI Điền Đầy Đủ & Đúng Chuẩn SEO):**
  - Nâng cấp luồng AI sinh bài (`packages/ai` và `workers/api/src/accept.ts`):
    - **SEO Slug tự động:** Chuyển đổi tiêu đề bài viết sang đường dẫn slug tiếng Việt chuẩn SEO (kebab-case không dấu, lược bỏ stop words).
    - **Meta Title:** Sinh tiêu đề SEO 50–60 ký tự, chứa Focus Keyword ở đầu câu.
    - **Meta Description:** Sinh mô tả tóm tắt hấp dẫn 150–160 ký tự chuẩn Search Snippet CTR cao.
    - **Tự động phân loại danh mục (`categorySlug`):** AI tự động gán bài vào đúng chuyên mục (`cong-nghe`, `kinh-te`, `xa-hoi`, `the-gioi`...).
    - **Focus Keyword & Tags:** AI trích xuất 1 từ khóa trọng tâm và 3-5 từ khóa phụ lưu vào trường `keywords`.
    - **Hero & OG Image:** Tự động trích xuất ảnh từ RSS feed (`og:image`, `enclosure`) lưu vào `heroImageUrl` và `ogImageUrl`.
    - **Canonical URL:** Tự động tạo URL chính tắc `https://mstudio.minds.io.vn/bai-viet/${slug}`.
    - **Cấu trúc On-Page Semantic:** Sinh cấu trúc bài báo phân cấp thẻ H2, H3, Sapo tóm tắt, bảng sự thật kiểm chứng (Facts), và khối FAQ Schema Markup.

## Sprint S09: International RSS Expansion, Awwwards Modern UX, PIN/Account Auth, In-CMS Email, Editor Rank Math & Auto-Writer (13-10-2026)

### 1. Mở Rộng Nguồn RSS Quốc Tế & Cộng Đồng Lớn (Đảm bảo mỗi chuyên mục 2–3 nguồn)
- **Công nghệ & Trí tuệ Nhân tạo (`cong-nghe`):**
  - TechCrunch (RSS chính), The Verge (Tech RSS), Hacker News Top Stories (Y Combinator), VnExpress Số Hóa.
- **Kinh tế & Thị trường (`kinh-te` / `kinh-doanh`):**
  - Bloomberg Markets, CNBC Top Business, CafeF Tài chính, VnEconomy.
- **Thế giới & Toàn cầu (`the-gioi`):**
  - Reuters World News, BBC World News, Tuổi Trẻ Thế Giới, VNExpress Quốc Tế.
- **Đời sống, Xã hội & Sức khỏe (`doi-song`, `xa-hoi`, `suc-khoe`):**
  - Tuổi Trẻ Đời Sống, Thanh Niên Giới Trẻ, Sức Khỏe & Đời Sống (Bộ Y Tế).
- **Khoa học & Đổi mới (`khoa-hoc`):**
  - Science Daily, Nature News RSS, VnExpress Khoa học.
- **Thể thao & Giải trí (`the-thao`, `giai-tri`):**
  - BBC Sport RSS, Tuổi Trẻ Thể Thao, Thanh Niên Văn Hóa Giải Trí.

### 2. Nâng Cấp Giao Diện Web Độc Giả (Homepage & Trang Con) Hiện Đại Chuẩn Awwwards / Apple News
- **Bento Grid & Visual Hierarchy:** Bố cục chia ô Bento tinh xảo, thẻ bài chính Lead Story với hiệu ứng ánh sáng Ambient Glow.
- **Micro-interactions:** Hiệu ứng hover nhấc nổi nhẹ (`hover:-translate-y-1`), thanh đọc audio tóm tắt nhanh (Web Speech TTS zero-cost), live indicators nhấp nháy cho tin nóng (Breaking News).
- **Dark/Light Mode tương phản cao:** Nền Obsidian `#080A0F`, đường viền kính hairline 1px, typography Inter/SF Pro tối ưu nhịp đọc.

### 3. Nâng Cấp Giao Diện Studio CMS Chuẩn Crafted SaaS (Linear / Raycast / Awwwards)
- **Command Palette (⌘K / Ctrl+K):** Tìm kiếm bài viết, chuyển trang nhanh, gọi các tác vụ duyệt bài ngay bằng bàn phím.
- **Phím tắt biên tập:** `J/K` để lướt danh sách tin, `E` để vào soạn thảo, `A` để duyệt (`Accept`), `R` để từ chối (`Reject`).
- **Giao diện Quick Triage:** Hỗ trợ duyệt nhanh dạng thẻ cho danh sách chờ duyệt 15 phút (`/newsroom/needs-review`).

### 4. Audit & Tối Ưu Toàn Bộ Luồng Vận Hành CMS (Workflow Architecture)
- **Luồng khép kín:** RSS Crawler -> Raw Items -> Story Clustering -> Gemini Verification Writer -> 15-Minute Grace Window -> Editor Intervention OR Auto-Publish -> CDN Cache Purge -> Sitemaps & Search Engine Indexing.
- **Cơ chế Cảnh báo Tin nóng:** Khi có ≥ 3 nguồn đưa tin cùng chủ đề trong 30 phút, hệ thống tự động đẩy cờ `isBreaking = true` lên trang chủ.

### 5. Tích Hợp Rank Math SEO Scorer Trực Tiếp Vào Trình Soạn Thảo (`/editor`)
- **Real-Time On-Page Score (0–100):** Tích hợp sidebar tính điểm ngay khi gõ tiêu đề, mô tả và nội dung bài viết.
- **Checklist 10 Tiêu chí:**
  1. Tiêu đề chứa Focus Keyword (độ dài 50–60 ký tự).
  2. Sapo mở đầu chứa Focus Keyword trong 100 từ đầu tiên.
  3. Mật độ từ khóa trọng tâm (Keyword Density đạt 1.0% – 2.5%).
  4. Cấu trúc bài viết có ít nhất một thẻ Heading H2/H3 chứa từ khóa.
  5. Độ dài bài viết đạt chuẩn (≥ 300 từ cho tin nhanh, ≥ 600 từ cho bài phân tích).
  6. Điểm dễ đọc Readability (Flesch Reading Ease score).
  7. Hình ảnh đại diện có thẻ ALT text chuẩn SEO.
  8. Liên kết nội bộ (Internal link) dẫn tới bài viết liên quan.
  9. Đường dẫn Slug ngắn gọn, chuẩn SEO không dấu.
  10. Xem trước Google Snippet (SERP Preview) trên cả giao diện Mobile và Desktop.

### 6. Hệ Thống Xác Thực CMS Toàn Diện: Mã PIN Nhanh "272113000" & Tài Khoản Email (Bỏ Token Thủ Công)
- **Mã PIN Nhanh Admin:** Hỗ trợ nhập PIN `272113000` tại `/login` để đăng nhập ngay quyền Human Lead / Admin trong 1 giây mà không cần copy paste Bearer Token.
- **Tài khoản Email & Mật khẩu:** Cho phép biên tập viên đăng nhập bằng email được cấp, hỗ trợ đổi mật khẩu trong `/settings`.
- **Session Management:** Tự động lưu phiên an toàn qua HttpOnly Cookie / Secure Local Storage, loại bỏ hoàn toàn ô nhập token thủ công rườm rà.

### 7. Module Hộp Thư Email Nội Bộ Bên Trong CMS (`/email`)
- **Hộp thư đến:** Tiếp nhận email phản hồi của độc giả, đính chính, đóng góp bài viết từ `contact@minds.io.vn`.
- **Soạn thư đi & Broadcast:** Gửi thông báo xuất bản cho ban biên tập, gửi bản tin Newsletter cho người đăng ký qua Cloudflare Email Routing / MailChannels / Resend.

### 8. Lối Vào CMS Trực Tiếp Từ Domain Chính
- Thêm route chuyển hướng `/cms`, `/admin`, `/studio` trên `https://mstudio.minds.io.vn` chuyển tiếp thẳng vào trang CMS an toàn.
- Nút truy cập nhanh *"Biên tập viên / Studio"* ở thanh điều hướng phụ hoặc footer của trang web chính.

### 9. Phân Bổ Danh Mục & Taxonomy Chuyên Mục Con Đầy Đủ
- Rà soát và gán nhãn chính xác cho mọi bài viết vào các danh mục con: `cong-nghe`, `kinh-te`, `the-gioi`, `thoi-su`, `xa-hoi`, `the-thao`, `giai-tri`, `khoa-hoc`, `xe`.
- Không để tồn tại bài viết có `category_slug = NULL`.

### 10. Kích Hoạt AI Viết Bài Tự Động Hôm Nay (Go-Live Daily Production)
- Quét các cụm tin thô hot nhất hôm nay (13-10-2026), kích hoạt `Evidence Verification Writer` sinh loạt bài viết có đầy đủ SEO, hình ảnh, thẻ phân loại và xuất bản ra trang chủ.

## Final principles
1. Trust over volume.
2. Free tier is architecture.
3. Cache before compute.
4. Evidence before prose.
5. Contracts before parallelism.
6. Mobile is a product surface.
7. Design consistency over gimmicks.
8. No silent risky automation.
9. Measure expensive paths.
10. Human retains architecture/editorial/release authority.
