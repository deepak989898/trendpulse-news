import { NextRequest, NextResponse } from "next/server";
import { updateAutomationSettings } from "@/lib/news";
import { AutomationSettings } from "@/lib/types";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  let frequency = "hourly";
  let trendWindow = "now 1-H";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    frequency = body.frequency;
    trendWindow = body.trendWindow;
  } else {
    const form = await request.formData();
    frequency = String(form.get("frequency") ?? "hourly");
    trendWindow = String(form.get("trendWindow") ?? "now 1-H");
  }

  await updateAutomationSettings({
    frequency: frequency as AutomationSettings["frequency"],
    trendWindow: trendWindow as AutomationSettings["trendWindow"],
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/admin", request.url));
}
