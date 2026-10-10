/**
 * ArticleHero — tầng A→B→C media fallback (FU-15).
 * - imageUrl (tầng A hotlink / tầng B R2 resolvedUrl): render <img> + credit.
 * - Không có ảnh: placeholder CSS deterministic theo seed (tầng C),
 *   đúng visual_effects_v1 (không 3D/glow/marquee).
 */

interface ArticleHeroProps {
  imageUrl?: string;
  credit?: string;
  alt?: string;
  /** Seed ổn định (vd article/story id) để placeholder nhất quán. */
  seed?: string;
}

const PLACEHOLDER_TONES = [
  "linear-gradient(135deg, var(--ink-900), var(--ink-700))",
  "linear-gradient(135deg, var(--ink-800), var(--gray))",
  "linear-gradient(45deg, var(--ink-900), var(--ink-800))",
  "linear-gradient(45deg, var(--soft), var(--border))",
] as const;

function toneIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % PLACEHOLDER_TONES.length;
}

export function ArticleHero({ imageUrl, credit, alt, seed }: ArticleHeroProps) {
  if (imageUrl) {
    return (
      <figure className="article-hero" style={{ margin: "0 0 24px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt ?? ""}
          loading="lazy"
          style={{
            aspectRatio: "16 / 9",
            borderRadius: "var(--radius-md)",
            display: "block",
            objectFit: "cover",
            width: "100%",
          }}
        />
        {credit ? (
          <figcaption style={{ color: "var(--gray)", fontSize: "var(--text-sm)", marginTop: 8 }}>
            Ảnh: {credit}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="article-hero-slot"
      role="presentation"
      style={{ background: PLACEHOLDER_TONES[toneIndex(seed ?? "mstudio")] }}
    />
  );
}
