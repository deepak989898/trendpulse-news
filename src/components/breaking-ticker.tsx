import { UiLang, uiText } from "@/lib/i18n";

const breakingFallback = {
  hi: [
    "Bharat bazar mein tezi — taza khabrein jaldi yahan",
    "IPL aur Cricket trends high hain",
    "Tech aur Government updates fast aa rahe hain",
  ],
  en: [
    "Indian markets and top stories — latest posts loading here",
    "IPL and Cricket trends are surging",
    "Tech and Government updates are accelerating",
  ],
};

type Props = {
  lang: UiLang;
  /** Latest story titles from the CMS; when empty, static fallback lines are used */
  headlines?: string[];
};

export function BreakingTicker({ lang, headlines = [] }: Props) {
  const t = uiText[lang];
  const live = headlines.map((h) => h.trim()).filter(Boolean);
  const scrollText =
    live.length > 0 ? [...live, ...live].join(" • ") : breakingFallback[lang].join(" • ");

  return (
    <div className="overflow-hidden border-b bg-red-600 py-2 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 text-sm md:px-6">
        <span className="shrink-0 font-semibold">{t.breaking}</span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="animate-[ticker_30s_linear_infinite] whitespace-nowrap">{scrollText}</div>
        </div>
      </div>
    </div>
  );
}
