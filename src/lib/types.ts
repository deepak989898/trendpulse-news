export const NEWS_CATEGORIES = [
  "Tech",
  "Business",
  "Sports",
  "Entertainment",
  "India",
  "World",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: NewsCategory;
  keywords: string[];
  imageUrl: string;
  createdAt: string;
  publishedAt: string;
  isApproved: boolean;
  sourceTopic: string;
  views: number;
};

export type AutomationSettings = {
  frequency: "hourly" | "4hour" | "daily";
  trendWindow: "now 1-H" | "now 4-H" | "now 1-d";
};

export type DashboardMetrics = {
  totalArticles: number;
  totalVisitors: number;
  trendingPosts: NewsArticle[];
  adRevenue: number;
};
