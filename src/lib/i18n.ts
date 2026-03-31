export type UiLang = "hi" | "en";

export const uiText = {
  hi: {
    trending: "Trending News (Hindi)",
    latest: "Taaza Khabrein",
    viewAll: "Sabhi Dekhein",
    searchPlaceholder: "Khabar khojen...",
    admin: "Admin",
    breaking: "Breaking",
    newsletter: "Newsletter",
    fallbackWarning: "Abhi real posts nahi mile. Firebase aur automation settings check karein.",
  },
  en: {
    trending: "Trending News",
    latest: "Latest News",
    viewAll: "View all",
    searchPlaceholder: "Search news...",
    admin: "Admin",
    breaking: "Breaking",
    newsletter: "Newsletter",
    fallbackWarning: "Real posts not available yet. Check Firebase/Automation settings.",
  },
} as const;
