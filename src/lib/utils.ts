import slugify from "slugify";

export function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
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
