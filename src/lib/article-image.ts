import type { NewsCategory } from "@/lib/types";

/** Curated Unsplash covers (news / tech / world) — stable URLs, varied per article */
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1495022320186-cac7ffd7c37d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560250097-190b602da8c6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
] as const;

const CATEGORY_BIAS: Partial<Record<NewsCategory, number>> = {
  Sports: 3,
  Tech: 5,
  Business: 6,
  Entertainment: 8,
  India: 2,
  World: 4,
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Ordered list of backup image URLs when `src` fails (403, 404, etc.).
 * Rotated by article id so broken images on different cards do not all swap to the same URL.
 */
export function getFallbackCoverChain(articleId: string, primaryUrl: string): string[] {
  const base = primaryUrl.split("?")[0];
  const pool = COVER_IMAGES.filter((u) => !u.startsWith(base));
  const h = hashString(articleId);
  const start = pool.length ? h % pool.length : 0;
  const rotated = pool.length ? [...pool.slice(start), ...pool.slice(0, start)] : [];

  const seeds = [h % 997, (h * 31 + 7) % 997, (h * 17 + 3) % 997];
  const safeId = articleId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "x";
  const picsum = seeds.map((s) => `https://picsum.photos/seed/tp${safeId}${s}/1200/700`);

  return [...rotated, ...picsum];
}

/** Deterministic but different image per topic/title/category */
export function pickArticleCoverImage(topic: string, title: string, category: NewsCategory): string {
  const bias = CATEGORY_BIAS[category] ?? 0;
  const seed = `${topic}\0${title}\0${category}`;
  const idx = (hashString(seed) + bias) % COVER_IMAGES.length;
  return COVER_IMAGES[idx];
}
