import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = checkRateLimit(`analytics-${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { event, path } = await request.json();
  if (!event || !path) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    await db.collection("analytics_events").add({
      event,
      path,
      country: request.headers.get("x-vercel-ip-country") ?? "unknown",
      city: request.headers.get("x-vercel-ip-city") ?? "unknown",
      createdAt: new Date().toISOString(),
    });
  } catch {
    // ignore in local mode
  }

  return NextResponse.json({ ok: true });
}
