import googleTrends from "google-trends-api";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings, saveArticle } from "@/lib/news";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";
import { toSlug } from "@/lib/utils";

export const runtime = "nodejs";

const PRIORITY_KEYWORDS = [
  "cricket",
  "ipl",
  "tech",
  "ai",
  "viral",
  "government",
  "govt",
  "policy",
  "india",
];

function pickCategory(topic: string): NewsCategory {
  const text = topic.toLowerCase();
  if (text.includes("cricket") || text.includes("ipl") || text.includes("match") || text.includes("league")) return "Sports";
  if (text.includes("government") || text.includes("govt") || text.includes("policy") || text.includes("minister")) return "India";
  if (text.includes("viral") || text.includes("trend")) return "Entertainment";
  if (text.includes("tech") || text.includes("ai") || text.includes("startup")) return "Tech";
  if (text.includes("market") || text.includes("stock") || text.includes("finance")) return "Business";
  if (text.includes("war") || text.includes("global") || text.includes("election")) return "World";
  if (text.includes("india")) return "India";
  return "Tech";
}

function scoreTopic(topic: string) {
  const text = topic.toLowerCase();
  let score = 0;
  for (const keyword of PRIORITY_KEYWORDS) {
    if (text.includes(keyword)) score += 2;
  }
  if (text.includes("cricket") || text.includes("ipl")) score += 3;
  return score;
}

function prioritizeTopics(topics: string[]) {
  return [...new Set(topics)]
    .sort((a, b) => scoreTopic(b) - scoreTopic(a))
    .slice(0, 6);
}

async function getTopicsByWindow(trendWindow: "now 1-H" | "now 4-H" | "now 1-d") {
  try {
    if (trendWindow === "now 1-d") {
      const result = await googleTrends.dailyTrends({ trendDate: new Date(), geo: "IN" });
      const parsed = JSON.parse(result) as {
        default: { trendingSearchesDays: Array<{ trendingSearches: Array<{ title: { query: string } }> }> };
      };
      const topics = parsed.default.trendingSearchesDays[0]?.trendingSearches?.map((item) => item.title.query) ?? [];
      return prioritizeTopics(topics);
    }

    const result = await googleTrends.realTimeTrends({ geo: "IN", category: "all" });
    const parsed = JSON.parse(result) as {
      storySummaries: { trendingStories: Array<{ title: string }> };
    };

    const count = trendWindow === "now 1-H" ? 8 : 12;
    const topics = parsed.storySummaries.trendingStories?.slice(0, count).map((item) => item.title) ?? [];
    return prioritizeTopics(topics);
  } catch {
    return [
      "IPL latest match updates",
      "Top tech innovations in India",
      "Viral stories trending today",
      "Government policy update India",
    ];
  }
}

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret) return true;

  const xSecret = request.headers.get("x-cron-secret") ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  return xSecret === secret || bearer === secret;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as {
      title: string;
      description: string;
      content: string;
      keywords: string[];
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
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
Return strict JSON with keys: title, description, content, keywords.
Requirements:
- prioritize India audience
- include facts only
- description around 150 chars
- 5 to 8 keywords
- content with short sections and bullet points`,
    });

    const parsedAi = safeJsonParse(completion.output_text);
    if (!parsedAi?.title || !parsedAi?.description || !parsedAi?.content) {
      continue;
    }

    const now = new Date().toISOString();
    const category = pickCategory(topic);

    const id = await saveArticle({
      title: parsedAi.title,
      slug: toSlug(parsedAi.title),
      description: parsedAi.description,
      content: parsedAi.content,
      category: NEWS_CATEGORIES.includes(category) ? category : "Tech",
      keywords: Array.isArray(parsedAi.keywords) ? parsedAi.keywords.slice(0, 8) : ["news", "trending", "india"],
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
    processedTopics: topics,
    trendWindow: settings.trendWindow,
    nextRunBasedOn: settings.frequency,
  });
}
