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
- Inter hoặc compatible system sans.
- Spacing 4/8px.
- Desktop max content khoảng 1200-1280px.
- Article giữ line length đọc được, không kéo full viewport.
- Shared radius/border/spacing tokens, tránh magic numbers.
- Tokenize repeated/shared design decisions. One-off values có nguồn gốc rõ ràng từ intrinsic layout hoặc calculation được phép giữ local. Không tạo token chỉ để thay tên cho một magic number.

Type scale (headline editorial lớn hơn định nghĩa riêng trong typography spec, không tự sinh 40/48/56/...):
```css
--text-xs:12px;
--text-sm:13px;
--text-base:16px;
--text-lg:18px;
--text-xl:20px;
--text-2xl:24px;
--text-3xl:28px;
--text-4xl:32px;
```

### Layout primitives
```css
--z-base:0;
--z-raised:10;
--z-sticky:50;
--z-overlay:100;
--z-modal:200;
--header-offset:97px;
```
Component dùng z-index theo vai trò (semantic), không ghi số trực tiếp. `--header-offset` phụ thuộc breakpoint nên token phải override theo breakpoint, không dùng một con số đo thủ công.

### Desktop
Sticky header, concise nav, trending strip, editorial hero + secondary rail, latest feed, sidebar modules, source-count metadata gần story meta.

### Mobile
Mobile là product surface riêng, không shrink desktop.

`compact header -> category -> headline -> dek -> source/time -> hero -> Quick Summary -> body -> context/timeline -> sources -> related`

Body article target khoảng 16-18px. Touch target đủ lớn. Tránh stack sidebar desktop cơ học.

### Article components
Category, headline, dek, author/editor attribution, published/modified, source count khi có dữ liệu thật, hero + caption/credit/rights, Quick Summary, rich blocks, quote, timeline, context, inline related, citations, corrections, entity/topic chips.

Không fabricate source count, trust score hoặc verified state.

### Vertical DNA
- Core News: monochrome editorial.
- AI Channel: monochrome + blue/data cues.
- Entertainment: image-driven magazine composition.
- Entertainment / Âm nhạc: may use media/video-forward layouts while remaining part of the Entertainment vertical.
- Crypto: data-friendly, green chỉ là accent.
- Góc Tối: restrained documentary, không imagery giật gân.
- Tâm sự: whitespace-heavy, reading-first.

Tất cả sử dụng chung tokens, accessibility và navigation system.

### Motion

Tokens (MStudio design-system decision, không phải WCAG requirement):

```css
--motion-duration-fast: 120ms;
--motion-duration-base: 200ms;
--motion-duration-slow: 320ms;
--motion-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

Rules:
- Motion must communicate hierarchy, feedback or state.
- Prefer transform/opacity for animated visual transitions.
- Never use `transition: all`.
- No decorative page transitions in v1.
- No continuous decorative animation.
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
