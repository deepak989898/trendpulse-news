import { NextRequest, NextResponse } from "next/server";
import { saveArticle } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/lib/types";
import { sanitizeHtmlLite, sanitizeText } from "@/lib/sanitize";
import { toSlug } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const title = sanitizeText(String(form.get("title") ?? ""));
  const description = sanitizeText(String(form.get("description") ?? ""));
  const content = sanitizeHtmlLite(String(form.get("content") ?? ""));
  const imageUrl = sanitizeText(String(form.get("imageUrl") ?? ""));
  const category = sanitizeText(String(form.get("category") ?? "Tech"));
  const keywords = sanitizeText(String(form.get("keywords") ?? "")).split(",").map((k) => k.trim()).filter(Boolean);

  if (!title || !description || !content || !keywords.length || !NEWS_CATEGORIES.includes(category as (typeof NEWS_CATEGORIES)[number])) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const now = new Date().toISOString();
  await saveArticle({
    title,
    slug: toSlug(title),
    description,
    content,
    category: category as (typeof NEWS_CATEGORIES)[number],
    keywords,
    imageUrl,
    createdAt: now,
    publishedAt: now,
    isApproved: true,
    sourceTopic: "manual",
    views: 0,
  });

  return NextResponse.redirect(new URL("/admin", request.url));
}
