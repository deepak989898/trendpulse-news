import { NextRequest, NextResponse } from "next/server";
import { deleteArticle, updateArticle } from "@/lib/news";

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
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}
