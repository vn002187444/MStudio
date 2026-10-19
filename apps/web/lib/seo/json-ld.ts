export interface NewsArticleJsonLd {
  "@context": "https://schema.org";
  "@type": "NewsArticle";
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    "@type": "Person" | "Organization";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    url: string;
    logo?: {
      "@type": "ImageObject";
      url: string;
    };
  };
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  image?: string[];
  inLanguage: "vi";
}

export function newsArticleJsonLd(
  article: {
    title: string;
    summary?: string;
    publishedAt?: string;
    modifiedAt?: string;
    author?: string;
    slug?: string;
    mainImage?: string;
  },
  siteOrigin: string
): NewsArticleJsonLd {
  const canonicalUrl = `${siteOrigin}/bai-viet/${article.slug || ""}`;
  const result: NewsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    inLanguage: "vi",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "MStudio Channel",
      url: siteOrigin,
      logo: {
        "@type": "ImageObject",
        url: `${siteOrigin}/favicon.svg`,
      },
    },
  };

  if (article.summary) {
    result.description = article.summary;
  }

  if (article.publishedAt) {
    result.datePublished = article.publishedAt;
  }

  if (article.modifiedAt || article.publishedAt) {
    result.dateModified = article.modifiedAt || article.publishedAt;
  }

  if (article.author) {
    result.author = {
      "@type": "Organization",
      name: article.author,
    };
  }

  if (article.mainImage) {
    result.image = [article.mainImage];
  }

  return result;
}