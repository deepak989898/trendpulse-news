import { UiLang, uiText } from "@/lib/i18n";

const breaking = {
  hi: [
    "Breaking: Bharat bazar mein tezi",
    "IPL aur Cricket trends high hain",
    "Tech aur Government updates fast aa rahe hain",
  ],
  en: [
    "Breaking: Indian markets react to fresh data",
    "IPL and Cricket trends are surging",
    "Tech and Government updates are accelerating",
  ],
};

export function BreakingTicker({ lang }: { lang: UiLang }) {
  const t = uiText[lang];
  return (
    <div className="overflow-hidden border-b bg-red-600 py-2 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 text-sm md:px-6">
        <span className="font-semibold">{t.breaking}</span>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-[ticker_30s_linear_infinite] whitespace-nowrap">{breaking[lang].join(" • ")}</div>
        </div>
      </div>
    </div>
  );
}
