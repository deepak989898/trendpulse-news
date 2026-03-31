import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = ["Tech", "Business", "Sports", "Entertainment", "India", "World"];

export function SiteHeader() {
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
          <input
            type="search"
            placeholder="Search news..."
            className="hidden rounded-full border px-3 py-1 text-sm md:block"
          />
          <ThemeToggle />
          <Link href="/admin" className="rounded-full border px-3 py-1 text-sm">
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
