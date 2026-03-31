import { NextRequest, NextResponse } from "next/server";
import { updateAdRevenue } from "@/lib/news";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const amount = Number(form.get("adRevenue") ?? 0);
  await updateAdRevenue(Number.isFinite(amount) ? Math.max(0, amount) : 0);
  return NextResponse.redirect(new URL("/admin", request.url));
}
