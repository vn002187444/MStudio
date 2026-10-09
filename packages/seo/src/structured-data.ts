import type { ArticleJsonLd, ArticleSeoInput } from "@mstudio/contracts";
import { canonicalizeUrl } from "./canonical.ts";

export function articleStructuredData(
  input: ArticleSeoInput,
): ArticleJsonLd {
  const canonicalUrl = canonicalizeUrl(input.canonicalUrl);
  const data: ArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: input.headline,
    description: input.description,
    datePublished: input.publishedAt,
    dateModified: input.modifiedAt ?? input.publishedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    publisher: { "@type": "Organization", name: input.publisherName },
  };
  if (input.author !== undefined) {
    data.author = { "@type": "Person", name: input.author };
  }
  if (input.publisherLogoUrl !== undefined) {
    data.publisher.logo = {
      "@type": "ImageObject",
      url: canonicalizeUrl(input.publisherLogoUrl),
    };
  }
  if (input.imageUrls !== undefined && input.imageUrls.length > 0) {
    data.image = input.imageUrls.map((url) => canonicalizeUrl(url));
  }
  return data;
}

export function serializeStructuredData(data: ArticleJsonLd): string {
  return JSON.stringify(data);
}
