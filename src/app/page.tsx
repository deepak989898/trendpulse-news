import Link from "next/link";
import { cookies } from "next/headers";
import { AdSenseSlot } from "@/components/adsense-slot";
import { ArticleCard } from "@/components/article-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { getCategoryArticles, getLatestArticles, getTrendingArticles } from "@/lib/news";
import { UiLang, uiText } from "@/lib/i18n";
import { NEWS_CATEGORIES } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  const lang = (await cookies()).get("tp_lang")?.value === "en" ? "en" : "hi";
  const t = uiText[lang as UiLang];

  const [trending, latest] = await Promise.all([getTrendingArticles(10), getLatestArticles(20)]);
  const sections = await Promise.all(
    NEWS_CATEGORIES.map(async (category) => ({
      category,
      articles: await getCategoryArticles(category, 4),
    })),
  );

  const isFallback = trending.some((item) => item.id.startsWith("seed-"));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-8">
        {isFallback ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            {t.fallbackWarning}
          </div>
        ) : null}

        <div>
          <h1 className="mb-4 text-3xl font-bold">{t.trending}</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        <AdSenseSlot slot="1234567890" className="rounded-xl border bg-white p-2 dark:bg-zinc-900" />

        <div>
          <h2 className="mb-4 text-2xl font-bold">{t.latest}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {latest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        {sections.map((section) => (
          <section key={section.category}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{section.category}</h3>
              <Link href={`/category/${section.category.toLowerCase()}`} className="text-sm text-blue-600">
                {t.viewAll}
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ))}
      </section>

      <aside className="space-y-4">
        <NewsletterForm />
        <AdSenseSlot slot="2234567890" className="rounded-xl border bg-white p-2 dark:bg-zinc-900" />
      </aside>
    </div>
  );
}
