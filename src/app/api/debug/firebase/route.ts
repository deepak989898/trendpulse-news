import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

function isAllowed(request: NextRequest) {
  const debugKey = request.headers.get("x-debug-key") ?? "";
  return Boolean(process.env.CRON_SECRET) && debugKey === process.env.CRON_SECRET;
}

export async function GET(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result: Record<string, unknown> = {
    hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
    hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };

  try {
    const db = getAdminDb();
    const snap = await db.collection("articles").limit(5).get();
    result.firestoreOk = true;
    result.articlesCountSample = snap.size;
    result.articleTitles = snap.docs.map((doc) => String(doc.data().title ?? ""));
  } catch (error) {
    result.firestoreOk = false;
    result.firestoreError = error instanceof Error ? error.message : "unknown firestore error";
  }

  try {
    const auth = getAdminAuth();
    const users = await auth.listUsers(1);
    result.authAdminOk = true;
    result.hasAnyAuthUser = users.users.length > 0;
  } catch (error) {
    result.authAdminOk = false;
    result.authAdminError = error instanceof Error ? error.message : "unknown auth error";
  }

  return NextResponse.json(result);
}
