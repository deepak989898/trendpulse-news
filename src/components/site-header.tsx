import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UiLang, uiText } from "@/lib/i18n";

const sections = ["Tech", "Business", "Sports", "Entertainment", "India", "World"];

export function SiteHeader({ lang }: { lang: UiLang }) {
  const t = uiText[lang];

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          TrendPulse News
        </Link>
        <nav className="hidden gap-4 text-sm md:flex">
          {sections.map((section) => (
            <Link key={section} href={`/category/${section.toLowerCase()}`} className="hover:text-blue-600">
              {section}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <input type="search" placeholder={t.searchPlaceholder} className="hidden rounded-full border px-3 py-1 text-sm md:block" />
          <LanguageToggle defaultLang={lang} />
          <ThemeToggle />
          <Link href="/admin" className="rounded-full border px-3 py-1 text-sm">
            {t.admin}
          </Link>
        </div>
      </div>
    </header>
  );
}
