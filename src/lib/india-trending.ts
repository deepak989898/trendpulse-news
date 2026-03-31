/**
 * Daily trending searches for India — RSS feed linked from Google Trends UI.
 * @see https://trends.google.com/trending?geo=IN
 */
const INDIA_DAILY_RSS =
  "https://trends.google.com/trendingsearches/daily/rss?geo=IN";

function parseRssItemTitles(xml: string): string[] {
  const out: string[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const titleMatch = block.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i);
    if (!titleMatch) continue;
    let raw = titleMatch[1].trim();
    const cdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (cdata) raw = cdata[1].trim();
    raw = raw.replace(/<[^>]+>/g, "").trim();
    raw = raw
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (raw.length > 0) out.push(raw);
  }
  return out;
}

function cleanTopicTitles(raw: string[]): string[] {
  const skip = /^(daily|google|search trends|trending searches)/i;
  return [...new Set(raw.map((t) => t.trim()).filter((t) => t.length > 1 && !skip.test(t)))];
}

export async function fetchIndiaTrendingFromRss(max = 25): Promise<{ topics: string[]; error: string | null }> {
  try {
    const res = await fetch(INDIA_DAILY_RSS, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { topics: [], error: `RSS HTTP ${res.status}` };
    }

    const xml = await res.text();
    const head = xml.trimStart().slice(0, 64).toLowerCase();
    if (head.startsWith("<!doctype") || head.startsWith("<html")) {
      return { topics: [], error: "RSS endpoint returned HTML (blocked or redirected)" };
    }

    const titles = cleanTopicTitles(parseRssItemTitles(xml));
    return { topics: titles.slice(0, max), error: titles.length ? null : "RSS had no item titles" };
  } catch (e) {
    return { topics: [], error: e instanceof Error ? e.message : "RSS fetch failed" };
  }
}
