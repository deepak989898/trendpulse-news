import Script from "next/script";
import { notFound } from "next/navigation";
import { AdSenseSlot } from "@/components/adsense-slot";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SocialShare } from "@/components/social-share";
import { getArticleBySlug, getLatestArticles } from "@/lib/news";
import { articleJsonLd, articleMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return articleMetadata(article);
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();
  const latest = await getLatestArticles(6);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <article className="rounded-xl border bg-white p-6 dark:bg-zinc-900">
        <Breadcrumbs category={article.category} title={article.title} />
        <p className="mb-2 text-xs uppercase tracking-wide text-blue-600">{article.category}</p>
        <h1 className="mb-3 font-serif text-3xl font-bold">{article.title}</h1>
        <p className="mb-4 text-zinc-600 dark:text-zinc-300">{article.description}</p>
        <div className="mb-5 text-sm text-zinc-500">{formatDate(article.publishedAt)}</div>
        <div className="article-content">
          {article.content.split("\n").map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <SocialShare title={article.title} />
        <AdSenseSlot slot="3234567890" className="my-6 rounded-lg border p-2" />
      </article>

      <aside className="space-y-3">
        <h2 className="text-lg font-semibold">Related stories</h2>
        {latest
          .filter((item) => item.slug !== article.slug)
          .map((item) => (
            <a key={item.id} href={`/news/${item.slug}`} className="block rounded-xl border bg-white p-3 dark:bg-zinc-900">
              <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
            </a>
          ))}
      </aside>
      <Script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }} />
    </div>
  );
}
