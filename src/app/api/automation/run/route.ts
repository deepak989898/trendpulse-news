import googleTrends from "google-trends-api";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { pickArticleCoverImage } from "@/lib/article-image";
import { fetchIndiaTrendingFromRss } from "@/lib/india-trending";
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
  const errors: string[] = [];
  const collected: string[] = [];

  const rss = await fetchIndiaTrendingFromRss(30);
  if (rss.topics.length > 0) {
    collected.push(...rss.topics);
  } else if (rss.error) {
    errors.push(`India RSS: ${rss.error}`);
  }

  try {
    const daily = await googleTrends.dailyTrends({ trendDate: new Date(), geo: "IN" });
    if (!daily.trimStart().startsWith("<")) {
      const dailyParsed = JSON.parse(daily) as {
        default: { trendingSearchesDays: Array<{ trendingSearches: Array<{ title: { query: string } }> }> };
      };
      const dailyTopics =
        dailyParsed.default.trendingSearchesDays[0]?.trendingSearches?.map((i) => i.title.query) ?? [];
      collected.push(...dailyTopics);
    } else {
      errors.push("google-trends-api dailyTrends returned HTML");
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "dailyTrends failed");
  }

  try {
    const realtime = await googleTrends.realTimeTrends({ geo: "IN", category: "all" });
    if (!realtime.trimStart().startsWith("<")) {
      const realParsed = JSON.parse(realtime) as { storySummaries?: { trendingStories?: Array<{ title: string }> } };
      const realTopics = realParsed.storySummaries?.trendingStories?.map((i) => i.title) ?? [];
      collected.push(...realTopics);
    }
  } catch {
    // optional
  }

  const rssOrdered = rss.topics;
  const scoredRest = prioritizeTopics(collected.filter((t) => !rssOrdered.includes(t)));
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const t of [...rssOrdered, ...scoredRest]) {
    if (!seen.has(t)) {
      seen.add(t);
      merged.push(t);
    }
  }
  const limit = trendWindow === "now 1-H" ? 10 : trendWindow === "now 4-H" ? 15 : 20;
  const topics = merged.slice(0, limit);

  if (topics.length > 0) {
    return {
      topics,
      trendsError: errors.length ? errors.join(" | ") : null,
    };
  }

  return {
    topics: [
      "IPL latest match updates",
      "Top tech innovation in India",
      "Viral social trend in India",
      "Government policy update",
      "Startup funding India",
    ],
    trendsError: errors.join(" | ") || "No trending topics from RSS or API",
  };
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
    const o = JSON.parse(text) as Record<string, unknown>;

    const nested =
      (typeof o.article === "object" && o.article !== null && o.article) ||
      (typeof o.data === "object" && o.data !== null && o.data) ||
      (typeof o.result === "object" && o.result !== null && o.result) ||
      o;

    const n = nested as Record<string, unknown>;

    const title = (n.title ?? n.headline ?? n.heading ?? n.subject) as string | undefined;
    const description = (n.description ?? n.meta_description ?? n.summary ?? n.excerpt) as string | undefined;
    const content = (n.content ?? n.body ?? n.text ?? n.article_body) as string | undefined;
    const kwRaw = n.keywords ?? n.tags;

    if (!title || !description || !content) return null;
    const keywords = Array.isArray(kwRaw) ? kwRaw.map(String) : typeof kwRaw === "string" ? [kwRaw] : [];

    return {
      title: String(title).trim(),
      description: String(description).trim(),
      content: String(content).trim(),
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
  const userPrompt = `This is a LIVE trending search query in India today (from Google Trends style feeds): "${topic}"

Write a factual, timely news-style article for an India audience. The story must feel current and tied to this exact trending topic — not generic evergreen filler.

Headline rule: the JSON "title" MUST include the exact trending phrase above (same words, same order is best). You may add a short subtitle after a colon or em dash if needed.

Language: Hindi for title, description, and main content. End with one short English summary paragraph.

Return ONLY a flat JSON object (no nesting, no markdown) with exactly these keys:
- "title" (string)
- "description" (string, ~150 characters, SEO meta)
- "content" (string, use newlines between paragraphs; bullets with - allowed)
- "keywords" (array of 6-10 short strings)

Do NOT wrap fields inside "article", "data", or "result".

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

    const choice = completion.choices[0];
    const raw = choice?.message?.content ?? "";
    const finish = choice?.finish_reason ?? "unknown";

    if (!raw.trim()) {
      return {
        data: null,
        rawSnippet: "",
        error: `OpenAI returned empty message (finish_reason=${finish}). Check model access / quota.`,
      };
    }

    const parsed = parseArticleJson(raw);
    if (!parsed) {
      return {
        data: null,
        rawSnippet: raw.slice(0, 500),
        error: `Could not parse JSON (finish_reason=${finish}). See snippet.`,
      };
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
      const resolvedCategory = NEWS_CATEGORIES.includes(category) ? category : "Tech";
      const id = await saveArticle({
        title: data.title,
        slug: toSlug(data.title),
        description: data.description,
        content: data.content,
        category: resolvedCategory,
        keywords: data.keywords.length ? data.keywords.slice(0, 10) : ["india", "trending", "news"],
        imageUrl: pickArticleCoverImage(topic, data.title, resolvedCategory),
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
    /** First error — read this if you do not scroll `failures` */
    primaryFailure: failures[0] ?? null,
    processedTopics: topics,
    trendsError,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    scheduleNote: "Run daily at 09:00 IST via Vercel cron",
  });
}
