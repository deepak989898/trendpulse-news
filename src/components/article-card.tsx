import Link from "next/link";
import { ArticleCoverImage } from "@/components/article-cover-image";
import { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900">
      <Link href={`/news/${article.slug}`}>
        <ArticleCoverImage
          articleId={article.id}
          src={article.imageUrl}
          alt={article.title}
          className="h-48 w-full object-cover"
        />
      </Link>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-wide text-blue-600">{article.category}</p>
        <Link href={`/news/${article.slug}`} className="line-clamp-2 text-lg font-semibold hover:text-blue-600">
          {article.title}
        </Link>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">{article.description}</p>
        <p className="text-xs text-zinc-500">{formatDate(article.publishedAt)}</p>
      </div>
    </article>
  );
}
