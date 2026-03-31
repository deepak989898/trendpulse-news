import Link from "next/link";
import { AdSenseSlot } from "@/components/adsense-slot";
import { ArticleCard } from "@/components/article-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { getCategoryArticles, getLatestArticles, getTrendingArticles } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/lib/types";

export const revalidate = 300;

export default async function Home() {
  const [trending, latest] = await Promise.all([getTrendingArticles(6), getLatestArticles(10)]);
  const sections = await Promise.all(
    NEWS_CATEGORIES.map(async (category) => ({
      category,
      articles: await getCategoryArticles(category, 4),
    })),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-8">
        <div>
          <h1 className="mb-4 text-3xl font-bold">Trending News</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>

        <AdSenseSlot slot="1234567890" className="rounded-xl border bg-white p-2 dark:bg-zinc-900" />

        <div>
          <h2 className="mb-4 text-2xl font-bold">Latest News</h2>
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
                View all
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
