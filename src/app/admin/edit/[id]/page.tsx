import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/lib/types";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> };

export default async function AdminEditArticlePage({ params, searchParams }: Props) {
  const { id } = await params;
  const q = await searchParams;
  const article = await getArticleById(id);
  if (!article) notFound();

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit post</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>

      {q.saved ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
          Saved successfully.
        </p>
      ) : null}
      {q.error === "missing" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Title, description, content, and image URL are required.
        </p>
      ) : null}
      {q.error === "category" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">Invalid category.</p>
      ) : null}

      <form action={`/api/articles/${id}`} method="post" className="space-y-4 rounded-xl border bg-white p-6 dark:bg-zinc-900">
        <input type="hidden" name="_action" value="update" />

        <label className="block text-sm font-medium">
          Title
          <input name="title" defaultValue={article.title} required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium">
          URL slug (optional — auto from title if empty)
          <input name="slug" defaultValue={article.slug} placeholder="my-article-slug" className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium">
          Category
          <select name="category" defaultValue={article.category} className="mt-1 w-full rounded-lg border px-3 py-2">
            {NEWS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Image URL
          <input name="imageUrl" type="url" defaultValue={article.imageUrl} required className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium">
          Keywords (comma separated)
          <input name="keywords" defaultValue={article.keywords?.join(", ") ?? ""} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium">
          Meta description
          <textarea name="description" defaultValue={article.description} required rows={3} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>

        <label className="block text-sm font-medium">
          Content
          <textarea name="content" defaultValue={article.content} required rows={14} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isApproved" value="true" defaultChecked={article.isApproved !== false} />
          Approved (visible on site)
        </label>

        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Save changes
          </button>
          <Link href={`/news/${article.slug}`} className="rounded-lg border px-4 py-2 text-sm" target="_blank" rel="noreferrer">
            View live
          </Link>
        </div>
      </form>
    </section>
  );
}
