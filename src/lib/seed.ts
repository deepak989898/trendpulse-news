import { NewsArticle } from "@/lib/types";

export const seedArticles: NewsArticle[] = [
  {
    id: "seed-1",
    title: "AI Chips Race Heats Up As Startups Challenge Big Tech",
    slug: "ai-chips-race-heats-up",
    description: "Funding and new launches are reshaping the semiconductor landscape for AI infrastructure.",
    content:
      "The global AI chip market is seeing intense competition as startups introduce specialized processors optimized for inference workloads. Analysts expect pricing pressure and rapid iteration cycles through this year.",
    category: "Tech",
    keywords: ["AI chips", "semiconductors", "startups"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    isApproved: true,
    sourceTopic: "AI chips",
    views: 1488,
  },
];
