import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { lang } = await request.json();
  const normalized = lang === "en" ? "en" : "hi";
  const res = NextResponse.json({ ok: true, lang: normalized });
  res.cookies.set("tp_lang", normalized, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
