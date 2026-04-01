import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { UiLang, uiText } from "@/lib/i18n";

const sections = ["Tech", "Business", "Sports", "Entertainment", "India", "World"];

const navLink =
  "text-sm font-medium text-zinc-800 transition-colors hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400";

export function SiteHeader({ lang }: { lang: UiLang }) {
  const t = uiText[lang];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/90 bg-white/95 text-zinc-900 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-50">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="shrink-0"
        >
          <Image
            src="/trendpulse-logo.svg"
            alt="TrendPulse News"
            width={190}
            height={56}
            priority
            className="h-10 w-auto md:h-11"
          />
        </Link>
        <nav className="hidden gap-4 md:flex" aria-label="Sections">
          {sections.map((section) => (
            <Link key={section} href={`/category/${section.toLowerCase()}`} className={navLink}>
              {section}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            className="hidden w-40 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 md:block dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-400 lg:w-52"
          />
          <LanguageToggle defaultLang={lang} />
          <ThemeToggle />
          <Link
            href="/admin"
            className={`rounded-full border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 ${navLink}`}
          >
            {t.admin}
          </Link>
        </div>
      </div>
    </header>
  );
}
