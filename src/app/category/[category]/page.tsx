import { ArticleCard } from "@/components/article-card";
import { getLatestArticles } from "@/lib/news";
import { NEWS_CATEGORIES, NewsCategory } from "@/lib/types";

type Props = { params: Promise<{ category: string }> };

export const revalidate = 300;

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const normalized = `${category.charAt(0).toUpperCase()}${category.slice(1)}` as NewsCategory;
  if (!NEWS_CATEGORIES.includes(normalized)) {
    return <div className="rounded-xl border bg-white p-6 dark:bg-zinc-900">Invalid category.</div>;
  }

  const articles = (await getLatestArticles(100)).filter((article) => article.category === normalized);

  return (
    <section>
      <h1 className="mb-5 text-3xl font-bold">{normalized} News</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
