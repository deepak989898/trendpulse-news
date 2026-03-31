import Image from "next/image";
import Link from "next/link";
import { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-zinc-900">
      <Link href={`/news/${article.slug}`}>
        <Image
          src={article.imageUrl}
          alt={article.title}
          width={1200}
          height={700}
          className="h-48 w-full object-cover"
          loading="lazy"
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
