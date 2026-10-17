# MSTUDIO V2.0 HYBRID GLASSMORPHIC PORTAL - TASK TRACKER

## Phase 1: Foundation & Brand Identity
- [x] 1.1: Design Tokens (`packages/ui/tokens.css` & `tokens.ts`) with Category Auras & Glassmorphic variables
- [x] 1.2: Brand Logo Monogram M v2 (`packages/ui/src/components/brand-logo.tsx`) with Sapphire Faceted Glass
- [x] 1.3: Dynamic SVG Favicon (`apps/web/public/favicon.svg`), Apple Touch Icon, `site.webmanifest`
- [x] 1.4: Dynamic Open Graph Engine (`apps/web/app/api/og/route.tsx`) running on Edge
- [x] 1.5: Setproduct Bento Grid Math verification (`BentoGrid`, `BentoCard`, `TiltCard`, `AmbientGlow`)

## Phase 2: Category-Specific DNA & Public Web Overhaul
- [x] 2.1: Specialized Category Widgets (`packages/ui/src/components/category-widgets.tsx`):
  - Tech/AI: `AIBenchmarkWidget`
  - Finance: `BentoMarketStrip`
  - World/Current: `CrisisTimeline`
  - Science: `ScienceDataBox`
  - Auto/EV: `EVParamWidget`
  - Life/Health: `HealthAirQualityWidget`
- [x] 2.2: Category Template (`apps/web/components/article/category-template.tsx`) with category-specific auras & bento layout
- [x] 2.3: Homepage (`apps/web/app/(public)/page.tsx`) upgrade with 3D Wave Hero & master bento
- [x] 2.4: Article Reading Page (`apps/web/app/(public)/bai-viet/[slug]/page.tsx`): 12-column Bento (8 cols reading + 4 cols sticky sidebar), Floating Glass Table of Contents
- [x] 2.5: Discovery Pages (`/danh-cho-ban`, `/dang-nong`, `/ai-channel`, `/search`)

## Phase 3: Mobile App-Like Ergonomics
- [x] 3.1: Curved Floating Glass Dock (`apps/web/components/navigation/mobile-tab-bar.tsx`) with Haptic scale
- [x] 3.2: Mobile Stories Rail for 24h breaking news (`apps/web/components/navigation/stories-rail.tsx`)
- [x] 3.3: iOS-style Table of Contents & Social Share HUD

## Phase 4: Studio CMS Telemetry HUD
- [x] 4.1: Studio Cockpit Shell (`apps/studio/components/studio-shell.tsx`)
- [x] 4.2: Overview Dashboard Telemetry HUD (`apps/studio/components/overview-dashboard.tsx`)

## Phase 5: Testing, QC & Cloudflare Live Deployment
- [x] 5.1: Typecheck & unit tests across all packages (100% pass)
- [x] 5.2: Production build validation (Web & Studio)
- [x] 5.3: Cloudflare deploy & live verification
