import { getAutomationSettings, getDashboardMetrics, getLatestArticles, getManagedCategories } from "@/lib/news";
import { NEWS_CATEGORIES } from "@/lib/types";

export default async function AdminPage() {
  const [metrics, settings, articles, managedCategories] = await Promise.all([
    getDashboardMetrics(),
    getAutomationSettings(),
    getLatestArticles(20),
    getManagedCategories(),
  ]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Total Articles</p><p className="text-2xl font-bold">{metrics.totalArticles}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Total Visitors</p><p className="text-2xl font-bold">{metrics.totalVisitors}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Trending Posts</p><p className="text-2xl font-bold">{metrics.trendingPosts.length}</p></div>
        <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900"><p className="text-sm text-zinc-500">Ad Revenue</p><p className="text-2xl font-bold">${metrics.adRevenue.toFixed(2)}</p></div>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Posting Priority (Applied)</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Automation now prioritizes: <b>Cricket/IPL</b>, <b>Tech</b>, <b>Viral topics</b>, <b>Government updates</b>.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Automation Settings</h2>
        <form action="/api/admin/frequency" method="post" className="flex flex-wrap items-end gap-3">
          <label className="text-sm">Frequency
            <select name="frequency" defaultValue={settings.frequency} className="ml-2 rounded border px-2 py-1">
              <option value="hourly">1 hour</option><option value="4hour">4 hours</option><option value="daily">Daily</option>
            </select>
          </label>
          <label className="text-sm">Trend Window
            <select name="trendWindow" defaultValue={settings.trendWindow} className="ml-2 rounded border px-2 py-1">
              <option value="now 1-H">Past 1 hour</option><option value="now 4-H">Past 4 hours</option><option value="now 1-d">Today</option>
            </select>
          </label>
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Update</button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Update Ad Revenue</h2>
        <form action="/api/admin/revenue" method="post" className="flex items-end gap-3">
          <label className="text-sm">Amount (USD)
            <input type="number" step="0.01" min="0" name="adRevenue" className="ml-2 rounded border px-2 py-1" required />
          </label>
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Save</button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Share + Indexing Tools</h2>
        <div className="flex flex-wrap gap-2">
          <form action="/api/seo/ping" method="post">
            <button className="rounded border px-3 py-2 text-sm">Ping Google/Bing Sitemap</button>
          </form>
          <a className="rounded border px-3 py-2 text-sm" target="_blank" rel="noreferrer" href="https://search.google.com/search-console">Open Search Console</a>
          <a className="rounded border px-3 py-2 text-sm" target="_blank" rel="noreferrer" href="https://search.google.com/search-console/inspect">Open URL Inspection</a>
        </div>
        <p className="mt-2 text-xs text-zinc-500">For manual indexing, open URL Inspection and submit your article URLs.</p>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Add Manual Article</h2>
        <form action="/api/articles/manual" method="post" className="grid gap-2 md:grid-cols-2">
          <input name="title" placeholder="Title" className="rounded border px-3 py-2" required />
          <input name="imageUrl" placeholder="Image URL" className="rounded border px-3 py-2" required />
          <select name="category" className="rounded border px-3 py-2" required>
            {NEWS_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
          <input name="keywords" placeholder="comma,separated,keywords" className="rounded border px-3 py-2" required />
          <textarea name="description" placeholder="Description" className="rounded border px-3 py-2 md:col-span-2" rows={2} required />
          <textarea name="content" placeholder="Full content" className="rounded border px-3 py-2 md:col-span-2" rows={6} required />
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white md:col-span-2">Publish Manual Article</button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Manage Categories</h2>
        <form action="/api/admin/categories" method="post" className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {NEWS_CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 rounded border p-2 text-sm">
                <input type="checkbox" name="categories" value={cat} defaultChecked={managedCategories.includes(cat)} />
                {cat}
              </label>
            ))}
          </div>
          <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Save Categories</button>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
        <h2 className="mb-3 text-xl font-semibold">Approve / Delete Posts</h2>
        <div className="space-y-2">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">{article.title}</p>
                <p className="text-xs text-zinc-500">{article.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={`/api/articles/${article.id}`} method="post" className="flex gap-2 text-sm">
                  <button name="_action" value={article.isApproved ? "unapprove" : "approve"} className="rounded border px-2 py-1">
                    {article.isApproved ? "Unapprove" : "Approve"}
                  </button>
                  <button name="_action" value="delete" className="rounded border px-2 py-1 text-red-600">Delete</button>
                </form>
                <form action="/api/distribution/publish" method="post" className="text-sm">
                  <input type="hidden" name="title" value={article.title} />
                  <input type="hidden" name="url" value={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/news/${article.slug}`} />
                  <button className="rounded border px-2 py-1">Get Share Links</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
