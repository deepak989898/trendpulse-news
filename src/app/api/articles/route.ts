import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveArticle } from "@/lib/news";
import { sanitizeHtmlLite, sanitizeText } from "@/lib/sanitize";
import { NEWS_CATEGORIES } from "@/lib/types";
import { toSlug } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(20),
  description: z.string().min(60),
  content: z.string().min(200),
  category: z.enum(NEWS_CATEGORIES),
  keywords: z.array(z.string()).min(3),
  imageUrl: z.string().url(),
  sourceTopic: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const now = new Date().toISOString();
  const id = await saveArticle({
    ...parsed.data,
    title: sanitizeText(parsed.data.title),
    description: sanitizeText(parsed.data.description),
    content: sanitizeHtmlLite(parsed.data.content),
    sourceTopic: sanitizeText(parsed.data.sourceTopic),
    keywords: parsed.data.keywords.map((k) => sanitizeText(k)),
    slug: toSlug(parsed.data.title),
    createdAt: now,
    publishedAt: now,
    isApproved: true,
    views: 0,
  });
  return NextResponse.json({ id });
}
