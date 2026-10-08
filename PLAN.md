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

```css
--black:#090909;
--ink:#101114;
--white:#FFFFFF;
--off-white:#F6F6F4;
--soft:#F6F7F9;
--gray:#667085;
--border:#E3E3E3;
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
- Entertainment: image-driven magazine.
- Music: media/video-forward.
- Crypto: data-friendly, green chỉ là accent.
- Góc Tối: restrained documentary, không imagery giật gân.
- Tâm sự: whitespace-heavy, reading-first.

Tất cả sử dụng chung tokens, accessibility và navigation system.

### Motion / accessibility
Motion subtle; respect prefers-reduced-motion. Semantic HTML, keyboard navigation, visible focus, contrast tốt và màu không phải signal duy nhất.

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
Worker APIs
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
├ workers/{ingest,normalize,intelligence,media,publish}/
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
