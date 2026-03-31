import slugify from "slugify";

/**
 * Hindi/Devanagari titles often become "" with strict slugify — breaks URLs and routing.
 */
export function toSlug(value: string) {
  const base = slugify(value, { lower: true, strict: true, trim: true });
  if (base.length > 0) return base;
  const fallback = slugify(value, { lower: true, strict: false, trim: true });
  if (fallback.length > 0) return fallback;
  return `post-${Date.now()}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trendpulse-news.vercel.app";
  return new URL(path, base).toString();
}
