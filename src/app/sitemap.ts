import type { MetadataRoute } from "next";
import { getLatestArticles } from "@/lib/news";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trendpulse-news.vercel.app";
  const articles = await getLatestArticles(200);
  const staticRoutes = ["", "/admin/login"].map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: path === "" ? 1 : 0.4,
  }));

  return [
    ...staticRoutes,
    ...articles.map((article) => ({
      url: `${site}/news/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
