export interface NewsArticleJsonLd {
  "@type": "NewsArticle";
  headline: string;
  description?: string;
  datePublished?: string;
  author?: string;
  mainEntityOfPage?: string;
  image?: string;
  inLanguage: "vi";
}

export function newsArticleJsonLd(
  article: {
    title: string;
    summary?: string;
    publishedAt?: string;
    author?: string;
    slug?: string;
    mainImage?: string;
  },
  siteOrigin: string
): NewsArticleJsonLd {
  const result: NewsArticleJsonLd = {
    "@type": "NewsArticle",
    headline: article.title,
    inLanguage: "vi",
  };

  if (article.summary) {
    result.description = article.summary;
  }

  if (article.publishedAt) {
    result.datePublished = article.publishedAt;
  }

  if (article.author) {
    result.author = article.author;
  }

  if (article.slug) {
    result.mainEntityOfPage = `${siteOrigin}/bai-viet/${article.slug}`;
  }

  if (article.mainImage) {
    result.image = article.mainImage;
  }

  return result;
}