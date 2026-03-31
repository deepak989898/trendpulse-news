import googleTrends from "google-trends-api";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getAutomationSettings, saveArticle } from "@/lib/news";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";
import { toSlug } from "@/lib/utils";

export const runtime = "nodejs";
/** Long runs: OpenAI + many Firestore writes (Vercel Pro: up to 300s; Hobby: 10–60s) */
export const maxDuration = 300;

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

async function getTopicsByWindow(trendWindow: "now 1-H" | "now 4-H" | "now 1-d"): Promise<{ topics: string[]; trendsError: string | null }> {
  try {
    const daily = await googleTrends.dailyTrends({ trendDate: new Date(), geo: "IN" });
    const dailyParsed = JSON.parse(daily) as {
      default: { trendingSearchesDays: Array<{ trendingSearches: Array<{ title: { query: string } }> }> };
    };
    const dailyTopics = dailyParsed.default.trendingSearchesDays[0]?.trendingSearches?.map((i) => i.title.query) ?? [];

    let realTopics: string[] = [];
    try {
      const realtime = await googleTrends.realTimeTrends({ geo: "IN", category: "all" });
      const realParsed = JSON.parse(realtime) as { storySummaries?: { trendingStories?: Array<{ title: string }> } };
      realTopics = realParsed.storySummaries?.trendingStories?.map((i) => i.title) ?? [];
    } catch {
      // realtime optional; daily alone is enough
    }

    const merged = prioritizeTopics([...dailyTopics, ...realTopics]);
    if (trendWindow === "now 1-H") return { topics: merged.slice(0, 10), trendsError: null };
    if (trendWindow === "now 4-H") return { topics: merged.slice(0, 15), trendsError: null };
    return { topics: merged.slice(0, 20), trendsError: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google Trends fetch failed";
    return {
      topics: [
        "IPL latest match updates",
        "Top tech innovation in India",
        "Viral social trend in India",
        "Government policy update",
        "Startup funding India",
      ],
      trendsError: msg,
    };
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

/** Strip ```json ... ``` or extra text around JSON */
function parseArticleJson(raw: string): { title: string; description: string; content: string; keywords: string[] } | null {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  try {
    const o = JSON.parse(text) as { title?: string; description?: string; content?: string; keywords?: unknown };
    if (!o.title || !o.description || !o.content) return null;
    const keywords = Array.isArray(o.keywords) ? o.keywords.map(String) : [];
    return {
      title: String(o.title),
      description: String(o.description),
      content: String(o.content),
      keywords,
    };
  } catch {
    return null;
  }
}

type ArticlePayload = NonNullable<ReturnType<typeof parseArticleJson>>;

async function generateArticle(
  openai: OpenAI,
  topic: string,
): Promise<{ data: ArticlePayload | null; rawSnippet: string; error: string | null }> {
  const userPrompt = `Topic: "${topic}"

Write a factual news-style article for an India audience.
Language: Hindi for title, description, and main content. End with one short English summary paragraph.

Return ONLY a JSON object (no markdown) with exactly these keys:
- "title" (string)
- "description" (string, ~150 characters, SEO meta)
- "content" (string, use newlines between paragraphs; can use simple bullets with - )
- "keywords" (array of 6-10 short strings)

Rules: neutral tone, no invented quotes, if uncertain say "reports suggest".`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a news editor. Output valid JSON only matching the user schema.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseArticleJson(raw);
    if (!parsed) {
      return { data: null, rawSnippet: raw.slice(0, 400), error: "Could not parse JSON from model output" };
    }
    return { data: parsed, rawSnippet: "", error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OpenAI request failed";
    return { data: null, rawSnippet: "", error: msg };
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getAutomationSettings();
  const { topics, trendsError } = await getTopicsByWindow(settings.trendWindow);
  return NextResponse.json({
    ok: true,
    settings,
    topicsCount: topics.length,
    topics,
    trendsError,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let maxTopics: number | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.maxTopics === "number" && body.maxTopics > 0) {
      maxTopics = Math.min(body.maxTopics, 20);
    }
  } catch {
    // no JSON body is fine
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

  const openai = new OpenAI({ apiKey });
  const settings = await getAutomationSettings();
  const { topics: allTopics, trendsError } = await getTopicsByWindow(settings.trendWindow);
  const topics = maxTopics != null ? allTopics.slice(0, maxTopics) : allTopics;

  const created: string[] = [];
  const failedTopics: string[] = [];
  const failures: Array<{ topic: string; reason: string; snippet?: string }> = [];

  for (const topic of topics) {
    try {
      const { data, rawSnippet, error } = await generateArticle(openai, topic);
      if (error || !data) {
        failedTopics.push(topic);
        failures.push({ topic, reason: error ?? "empty parse", snippet: rawSnippet || undefined });
        continue;
      }
      const now = new Date().toISOString();
      const category = pickCategory(topic);
      const id = await saveArticle({
        title: data.title,
        slug: toSlug(data.title),
        description: data.description,
        content: data.content,
        category: NEWS_CATEGORIES.includes(category) ? category : "Tech",
        keywords: data.keywords.length ? data.keywords.slice(0, 10) : ["india", "trending", "news"],
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
        createdAt: now,
        publishedAt: now,
        isApproved: true,
        sourceTopic: topic,
        views: 0,
      });
      created.push(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "save failed";
      failedTopics.push(topic);
      failures.push({ topic, reason: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    createdCount: created.length,
    created,
    failedTopics,
    failures,
    processedTopics: topics,
    trendsError,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    scheduleNote: "Run daily at 09:00 IST via Vercel cron",
  });
}
