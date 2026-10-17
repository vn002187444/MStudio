import { GlassCard, GlassBadge, AmbientGlow } from "@mstudio/ui";

/**
 * ArticleHero (MST-110 Hybrid Glassmorphic).
 * Immersive glass article hero with verified badge.
 */

interface ArticleHeroProps {
  imageUrl?: string;
  credit?: string;
  alt?: string;
  seed?: string;
}

const PLACEHOLDER_TONES = [
  "linear-gradient(135deg, var(--void-deep), var(--void-surface))",
  "linear-gradient(135deg, #0f172a, #1e293b)",
  "linear-gradient(45deg, #1e1b4b, #312e81)",
  "linear-gradient(45deg, #022c22, #064e3b)",
] as const;

function toneIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % PLACEHOLDER_TONES.length;
}

export function ArticleHero({ imageUrl, credit, alt, seed }: ArticleHeroProps) {
  const gradient = PLACEHOLDER_TONES[toneIndex(seed ?? "mstudio")];

  return (
    <figure className="relative w-full mb-8 rounded-[var(--bento-radius-lg-outer)] overflow-hidden group">
      {/* Background Container */}
      <div className="relative aspect-[16/9] md:aspect-[2/1] w-full overflow-hidden bg-[var(--void-deep)]">
        {imageUrl ? (
          <>
            <AmbientGlow color="rgba(255,255,255,0.15)" className="z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={alt ?? ""}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            {/* Subtle bottom gradient for overlay text visibility if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
          </>
        ) : (
          <div aria-hidden="true" className="absolute inset-0" style={{ background: gradient }} />
        )}

        {/* Floating Badges */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <GlassBadge className="bg-black/40 border-white/20 text-white backdrop-blur-xl shadow-lg">
            <span className="text-emerald-400 mr-1">✓</span> Đã xác thực
          </GlassBadge>
        </div>
      </div>

      {credit && (
        <figcaption className="absolute bottom-4 right-4 z-20">
          <GlassCard variant="dark" className="px-3 py-1.5 rounded-full text-[11px] text-white/80 font-medium border-white/10 shadow-lg">
            Ảnh: {credit}
          </GlassCard>
        </figcaption>
      )}
    </figure>
  );
}
