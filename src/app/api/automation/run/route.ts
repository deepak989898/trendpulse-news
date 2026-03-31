import googleTrends from "google-trends-api";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings, saveArticle } from "@/lib/news";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";
import { toSlug } from "@/lib/utils";

export const runtime = "nodejs";

const PRIORITY_KEYWORDS = ["cricket", "ipl", "tech", "ai", "viral", "government", "policy", "india", "startup"];

function pickCategory(topic: string): NewsCategory {
  const text = topic.toLowerCase();
  if (text.includes("cricket") || text.includes("ipl") || text.includes("match") || text.includes("league")) return "Sports";
  if (text.includes("government") || text.includes("policy") || text.includes("minister")) return "India";
  if (text.includes("viral") || text.includes("trend")) return "Entertainment";
  if (text.includes("tech") || text.includes("ai") || text.includes("startup")) return "Tech";
  if (text.includes("market") || text.includes("stock") || text.includes("finance")) return "Business";
  if (text.includes("war") || text.includes("global") || text.includes("election")) return "World";
  return "Tech";
}

function scoreTopic(topic: string) {
  const text = topic.toLowerCase();
  let score = 0;
  for (const k of PRIORITY_KEYWORDS) if (text.includes(k)) score += 2;
  if (text.includes("cricket") || text.includes("ipl")) score += 4;
  return score;
}

function prioritizeTopics(topics: string[]) {
  return [...new Set(topics)].sort((a, b) => scoreTopic(b) - scoreTopic(a)).slice(0, 20);
}

async function getTopicsByWindow(trendWindow: "now 1-H" | "now 4-H" | "now 1-d") {
  try {
    const daily = await googleTrends.dailyTrends({ trendDate: new Date(), geo: "IN" });
    const dailyParsed = JSON.parse(daily) as {
      default: { trendingSearchesDays: Array<{ trendingSearches: Array<{ title: { query: string } }> }> };
    };
    const dailyTopics = dailyParsed.default.trendingSearchesDays[0]?.trendingSearches?.map((i) => i.title.query) ?? [];

    const realtime = await googleTrends.realTimeTrends({ geo: "IN", category: "all" });
    const realParsed = JSON.parse(realtime) as { storySummaries: { trendingStories: Array<{ title: string }> } };
    const realTopics = realParsed.storySummaries.trendingStories?.map((i) => i.title) ?? [];

    const merged = prioritizeTopics([...dailyTopics, ...realTopics]);
    if (trendWindow === "now 1-H") return merged.slice(0, 10);
    if (trendWindow === "now 4-H") return merged.slice(0, 15);
    return merged.slice(0, 20);
  } catch {
    return [
      "IPL latest match updates",
      "Top tech innovation in India",
      "Viral social trend in India",
      "Government policy update",
      "Startup funding India",
      "Cricket points table",
      "AI product launches",
      "Election and governance update",
      "India business market trend",
      "Global world headline",
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

async function generateArticle(openai: OpenAI, topic: string) {
  const prompt = `Topic: ${topic}
Language: Hindi by default. Add 1 short English summary paragraph at end.
Return STRICT JSON with keys title, description, content, keywords.
Rules:
- SEO friendly title and meta description
- factual neutral style
- include sections and bullets
- 6 to 10 keywords
- audience: India`;

  const res = await openai.responses.create({ model: "gpt-4.1-mini", input: prompt });
  try {
    return JSON.parse(res.output_text) as { title: string; description: string; content: string; keywords: string[] };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getAutomationSettings();
  const topics = await getTopicsByWindow(settings.trendWindow);
  return NextResponse.json({ ok: true, settings, topicsCount: topics.length, topics });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  const openai = new OpenAI({ apiKey });
  const settings = await getAutomationSettings();
  const topics = await getTopicsByWindow(settings.trendWindow);

  const created: string[] = [];
  const failedTopics: string[] = [];

  for (const topic of topics) {
    try {
      const ai = await generateArticle(openai, topic);
      if (!ai?.title || !ai.description || !ai.content) {
        failedTopics.push(topic);
        continue;
      }
      const now = new Date().toISOString();
      const category = pickCategory(topic);
      const id = await saveArticle({
        title: ai.title,
        slug: toSlug(ai.title),
        description: ai.description,
        content: ai.content,
        category: NEWS_CATEGORIES.includes(category) ? category : "Tech",
        keywords: Array.isArray(ai.keywords) ? ai.keywords.slice(0, 10) : ["india", "trending", "news"],
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
        createdAt: now,
        publishedAt: now,
        isApproved: true,
        sourceTopic: topic,
        views: 0,
      });
      created.push(id);
    } catch {
      failedTopics.push(topic);
    }
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
    failedTopics,
    processedTopics: topics,
    scheduleNote: "Run daily at 09:00 IST via Vercel cron",
  });
}
