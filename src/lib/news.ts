import { getAdminDb } from "@/lib/firebase-admin";
import { seedArticles } from "@/lib/seed";
import { AutomationSettings, DashboardMetrics, NewsArticle, NewsCategory } from "@/lib/types";

const ARTICLES = "articles";
const SETTINGS = "settings";
const ANALYTICS = "analytics";

const hasFirebaseAdminEnv = Boolean(
  process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY,
);

function toArticleList(snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NewsArticle);
}

function fallbackArticles() {
  if (process.env.NODE_ENV === "development") return seedArticles;
  return [] as NewsArticle[];
}

export async function getLatestArticles(limit = 20) {
  if (!hasFirebaseAdminEnv) return fallbackArticles();
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection(ARTICLES).orderBy("publishedAt", "desc").limit(limit * 3).get();
    const articles = toArticleList(snapshot).filter((item) => item.isApproved !== false);
    return articles.slice(0, limit);
  } catch (error) {
    console.error("getLatestArticles error", error);
    return fallbackArticles();
  }
}

export async function getTrendingArticles(limit = 8) {
  if (!hasFirebaseAdminEnv) return fallbackArticles();
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection(ARTICLES).orderBy("views", "desc").limit(limit * 3).get();
    const articles = toArticleList(snapshot).filter((item) => item.isApproved !== false);
    return articles.slice(0, limit);
  } catch (error) {
    console.error("getTrendingArticles error", error);
    return fallbackArticles();
  }
}

export async function getCategoryArticles(category: NewsCategory, limit = 6) {
  const all = await getLatestArticles(80);
  return all.filter((article) => article.category === category).slice(0, limit);
}

export async function getArticleBySlug(slug: string) {
  const all = await getLatestArticles(250);
  return all.find((article) => article.slug === slug);
}

export async function getArticleById(id: string): Promise<NewsArticle | null> {
  if (!hasFirebaseAdminEnv) return null;
  try {
    const adminDb = getAdminDb();
    const snap = await adminDb.collection(ARTICLES).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as NewsArticle;
  } catch (error) {
    console.error("getArticleById error", error);
    return null;
  }
}

export async function saveArticle(input: Omit<NewsArticle, "id">) {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection(ARTICLES).add(input);
  return doc.id;
}

export async function updateArticle(id: string, patch: Partial<NewsArticle>) {
  const adminDb = getAdminDb();
  await adminDb.collection(ARTICLES).doc(id).update(patch);
}

export async function deleteArticle(id: string) {
  const adminDb = getAdminDb();
  await adminDb.collection(ARTICLES).doc(id).delete();
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  if (!hasFirebaseAdminEnv) return { frequency: "hourly", trendWindow: "now 1-H" };
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection(SETTINGS).doc("automation").get();
    if (!snapshot.exists) return { frequency: "hourly", trendWindow: "now 1-H" };
    return snapshot.data() as AutomationSettings;
  } catch (error) {
    console.error("getAutomationSettings error", error);
    return { frequency: "hourly", trendWindow: "now 1-H" };
  }
}

export async function updateAutomationSettings(settings: AutomationSettings) {
  const adminDb = getAdminDb();
  await adminDb.collection(SETTINGS).doc("automation").set(settings, { merge: true });
}

export async function getManagedCategories() {
  if (!hasFirebaseAdminEnv) return [] as string[];
  try {
    const adminDb = getAdminDb();
    const snapshot = await adminDb.collection(SETTINGS).doc("categories").get();
    if (!snapshot.exists) return [] as string[];
    const data = snapshot.data() as { enabled?: string[] };
    return data.enabled ?? [];
  } catch (error) {
    console.error("getManagedCategories error", error);
    return [] as string[];
  }
}

export async function updateManagedCategories(categories: string[]) {
  const adminDb = getAdminDb();
  await adminDb.collection(SETTINGS).doc("categories").set({ enabled: categories }, { merge: true });
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [latest, trending] = await Promise.all([getLatestArticles(200), getTrendingArticles(5)]);
  let totalVisitors = latest.reduce((sum, item) => sum + (item.views ?? 0), 0);
  let adRevenue = 0;
  if (!hasFirebaseAdminEnv) {
    return {
      totalArticles: latest.length,
      totalVisitors,
      trendingPosts: trending,
      adRevenue,
    };
  }

  try {
    const adminDb = getAdminDb();
    const analytics = await adminDb.collection(ANALYTICS).doc("summary").get();
    if (analytics.exists) {
      const data = analytics.data() as { totalVisitors?: number; adRevenue?: number };
      totalVisitors = data.totalVisitors ?? totalVisitors;
      adRevenue = data.adRevenue ?? 0;
    }
  } catch (error) {
    console.error("getDashboardMetrics error", error);
  }
  return {
    totalArticles: latest.length,
    totalVisitors,
    trendingPosts: trending,
    adRevenue,
  };
}

export async function updateAdRevenue(amount: number) {
  const adminDb = getAdminDb();
  await adminDb.collection(ANALYTICS).doc("summary").set({ adRevenue: amount }, { merge: true });
}
