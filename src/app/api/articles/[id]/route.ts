import { NextRequest, NextResponse } from "next/server";
import { deleteArticle, updateArticle } from "@/lib/news";
import { sanitizeHtmlLite, sanitizeText } from "@/lib/sanitize";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";
import { toSlug } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
  const form = await request.formData();
  const action = String(form.get("_action") ?? "");

  if (action === "delete") {
    await deleteArticle(id);
  } else if (action === "approve") {
    await updateArticle(id, { isApproved: true });
  } else if (action === "unapprove") {
    await updateArticle(id, { isApproved: false });
  } else if (action === "update") {
    const title = sanitizeText(String(form.get("title") ?? ""));
    const description = sanitizeText(String(form.get("description") ?? ""));
    const content = sanitizeHtmlLite(String(form.get("content") ?? ""));
    const imageUrl = sanitizeText(String(form.get("imageUrl") ?? ""));
    const category = String(form.get("category") ?? "Tech");
    const slugInput = sanitizeText(String(form.get("slug") ?? ""));
    const keywordsRaw = String(form.get("keywords") ?? "");
    const keywords = keywordsRaw
      .split(",")
      .map((k) => sanitizeText(k))
      .filter(Boolean);
    const approved = String(form.get("isApproved")) === "true";

    if (!title || !description || !content || !imageUrl) {
      return NextResponse.redirect(new URL(`/admin/edit/${id}?error=missing`, request.url));
    }
    if (!NEWS_CATEGORIES.includes(category as NewsCategory)) {
      return NextResponse.redirect(new URL(`/admin/edit/${id}?error=category`, request.url));
    }

    const slug = slugInput.length > 0 ? toSlug(slugInput) : toSlug(title);

    await updateArticle(id, {
      title,
      description,
      content,
      imageUrl,
      category: category as NewsCategory,
      keywords: keywords.length ? keywords : ["news"],
      slug,
      isApproved: approved,
    });
    return NextResponse.redirect(new URL(`/admin/edit/${id}?saved=1`, request.url));
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
