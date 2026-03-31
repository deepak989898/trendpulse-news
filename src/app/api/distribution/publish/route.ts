import { NextRequest, NextResponse } from "next/server";

function makeLinks(text: string, url: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
}

async function maybePostTelegram(title: string, url: string) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChannelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!telegramBotToken || !telegramChannelId) return false;

  try {
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChannelId,
        text: `${title}\n\n${url}`,
        disable_web_page_preview: false,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  let title = "";
  let url = "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    title = String(body.title ?? "");
    url = String(body.url ?? "");
  } else {
    const form = await request.formData();
    title = String(form.get("title") ?? "");
    url = String(form.get("url") ?? "");
  }

  if (!title || !url) {
    return NextResponse.json({ error: "title and url required" }, { status: 400 });
  }

  const links = makeLinks(title, url);
  const telegramPosted = await maybePostTelegram(title, url);

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(links.whatsapp);
  }

  return NextResponse.json({ ok: true, telegramPosted, shareLinks: links });
}
