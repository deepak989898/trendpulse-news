import type { Metadata } from "next";
import { NewsArticle } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export function articleMetadata(article: NewsArticle): Metadata {
  const url = absoluteUrl(`/news/${article.slug}`);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    keywords: article.keywords,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url,
      images: [{ url: article.imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [article.imageUrl],
    },
  };
}

export function articleJsonLd(article: NewsArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.createdAt,
    author: { "@type": "Organization", name: "TrendPulse News AI Desk" },
    publisher: { "@type": "Organization", name: "TrendPulse News" },
    image: [article.imageUrl],
    mainEntityOfPage: absoluteUrl(`/news/${article.slug}`),
  };
}
