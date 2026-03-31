import Script from "next/script";
import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/site-header";
import { BreakingTicker } from "@/components/breaking-ticker";
import { AdSenseSlot } from "@/components/adsense-slot";
import { PageTracker } from "@/components/page-tracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://trendpulse-news.vercel.app"),
  title: {
    default: "TrendPulse News | AI-Powered Breaking News",
    template: "%s | TrendPulse News",
  },
  description:
    "TrendPulse News delivers AI-powered coverage across tech, business, sports, entertainment, India, and world events.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TrendPulse News",
    description: "AI-powered modern newsroom with trending and latest stories.",
    siteName: "TrendPulse News",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrendPulse News",
    description: "AI-powered modern newsroom with trending and latest stories.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = (await cookies()).get("tp_lang")?.value === "en" ? "en" : "hi";

  return (
    <html lang={lang === "hi" ? "hi" : "en"} suppressHydrationWarning className={`${inter.variable} ${merriweather.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
        <SiteHeader lang={lang} />
        <AdSenseSlot slot="1111111111" className="mx-auto mt-2 max-w-7xl rounded border bg-white p-2 dark:bg-zinc-900" />
        <BreakingTicker lang={lang} />
        <PageTracker />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6">{children}</main>
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-script" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag("js", new Date()); gtag("config", "${process.env.NEXT_PUBLIC_GA_ID}");`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
