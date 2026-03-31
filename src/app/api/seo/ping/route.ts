import { NextResponse } from "next/server";

export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) {
    return NextResponse.json({ error: "Missing NEXT_PUBLIC_SITE_URL" }, { status: 400 });
  }

  const sitemap = `${site}/sitemap.xml`;
  const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`;
  const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`;

  const results = await Promise.allSettled([fetch(googleUrl), fetch(bingUrl)]);

  return NextResponse.json({
    ok: true,
    sitemap,
    googlePing: results[0].status,
    bingPing: results[1].status,
    note: "Use Google Search Console URL Inspection to request manual indexing for important pages.",
  });
}
