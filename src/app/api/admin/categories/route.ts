import { NextRequest, NextResponse } from "next/server";
import { NEWS_CATEGORIES } from "@/lib/types";
import { updateManagedCategories } from "@/lib/news";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const selected = form.getAll("categories").map((item) => String(item));
  const filtered = selected.filter((item) => NEWS_CATEGORIES.includes(item as (typeof NEWS_CATEGORIES)[number]));
  await updateManagedCategories(filtered);
  return NextResponse.redirect(new URL("/admin", request.url));
}
