export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export interface NewsSitemapEntry {
  loc: string;
  title: string;
  publicationDate: string;
  publicationName: string;
  language?: string;
}

export type SitemapEventKind =
  | "article_published"
  | "article_updated"
  | "article_corrected"
  | "article_retracted";

export interface SitemapEvent {
  kind: SitemapEventKind;
  url: string;
  lastmod: string;
}

export interface ArticleSeoInput {
  headline: string;
  description: string;
  canonicalUrl: string;
  publishedAt: string;
  modifiedAt?: string;
  author?: string;
  publisherName: string;
  publisherLogoUrl?: string;
  imageUrls?: string[];
}

export interface ArticleJsonLd {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: { "@type": "WebPage"; "@id": string };
  author?: { "@type": "Person"; name: string };
  publisher: {
    "@type": "Organization";
    name: string;
    logo?: { "@type": "ImageObject"; url: string };
  };
  image?: string[];
}

export interface LlmsCategoryEntry {
  slug: string;
  name: string;
  description?: string;
}

export interface LlmsArticleEntry {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  categorySlug?: string;
  updatedAt?: string;
}

export interface LlmsTxtOptions {
  siteTitle?: string;
  siteDescription?: string;
  siteOrigin: string;
  categories?: LlmsCategoryEntry[];
  articles?: LlmsArticleEntry[];
  optionalLinks?: Array<{ title: string; url: string; description?: string }>;
}

