import googleTrends from "google-trends-api";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings, saveArticle } from "@/lib/news";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";
import { toSlug } from "@/lib/utils";

export const runtime = "nodejs";

function pickCategory(topic: string): NewsCategory {
  const text = topic.toLowerCase();
  if (text.includes("match") || text.includes("league") || text.includes("cricket")) return "Sports";
  if (text.includes("india")) return "India";
  if (text.includes("market") || text.includes("stock") || text.includes("finance")) return "Business";
  if (text.includes("movie") || text.includes("series") || text.includes("music")) return "Entertainment";
  if (text.includes("war") || text.includes("global") || text.includes("election")) return "World";
  return "Tech";
}

async function getTopicsByWindow(trendWindow: "now 1-H" | "now 4-H" | "now 1-d") {
  if (trendWindow === "now 1-d") {
    const result = await googleTrends.dailyTrends({ trendDate: new Date(), geo: "IN" });
    const parsed = JSON.parse(result) as {
      default: { trendingSearchesDays: Array<{ trendingSearches: Array<{ title: { query: string } }> }> };
    };
    return parsed.default.trendingSearchesDays[0]?.trendingSearches?.slice(0, 5).map((item) => item.title.query) ?? [];
  }

  const result = await googleTrends.realTimeTrends({ geo: "IN", category: "all" });
  const parsed = JSON.parse(result) as {
    storySummaries: { trendingStories: Array<{ title: string }> };
  };

  // For 1h vs 4h, we still use real-time list, but process fewer/more topics.
  const count = trendWindow === "now 1-H" ? 3 : 6;
  return parsed.storySummaries.trendingStories?.slice(0, count).map((item) => item.title) ?? [];
}

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if ((process.env.CRON_SECRET ?? "") && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey });

  const settings = await getAutomationSettings();
  const topics = await getTopicsByWindow(settings.trendWindow);

  const created: string[] = [];
  for (const topic of topics) {
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `Write a factual SEO news article for topic: "${topic}".
Return valid JSON with: title,description,content,keywords(array of 6 strings).
Tone: neutral newsroom. Include implications and a short FAQ section.`,
    });

    const text = completion.output_text;
    const parsedAi = JSON.parse(text) as {
      title: string;
      description: string;
      content: string;
      keywords: string[];
    };
    const now = new Date().toISOString();
    const category = pickCategory(topic);

    const id = await saveArticle({
      title: parsedAi.title,
      slug: toSlug(parsedAi.title),
      description: parsedAi.description,
      content: parsedAi.content,
      category: NEWS_CATEGORIES.includes(category) ? category : "Tech",
      keywords: parsedAi.keywords,
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
      createdAt: now,
      publishedAt: now,
      isApproved: true,
      sourceTopic: topic,
      views: 0,
    });
    created.push(id);
  }

  return NextResponse.json({
    ok: true,
    created,
    trendWindow: settings.trendWindow,
    nextRunBasedOn: settings.frequency,
  });
}
