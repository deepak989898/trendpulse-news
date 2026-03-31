# TrendPulse News

TrendPulse News is a full-stack AI-powered modern news website using Next.js, Tailwind CSS, Firebase, and OpenAI.

## What is Implemented

- Next.js App Router (latest) + Tailwind CSS + TypeScript
- Mobile-first responsive news UI (Google News inspired)
- Homepage sections:
  - Trending News
  - Latest News
  - Category blocks (Tech, Business, Sports, Entertainment, India, World)
- Sticky header + search input + dark/light toggle
- Breaking news ticker
- SEO:
  - Dynamic metadata
  - JSON-LD NewsArticle schema
  - SEO slugs
  - sitemap.xml + robots.txt
  - Internal linking via related stories + category links
  - Breadcrumb navigation on article pages
- Admin panel:
  - Firebase Auth login flow
  - Metrics cards (visitors, articles, trending, ad revenue)
  - Approve/unapprove/delete posts
  - Change posting frequency + trend window
  - Add manual article
  - Manage enabled categories
  - Manual ad revenue update
- AI automation API:
  - Google Trends fetch
  - Trend window support (1h / 4h / today)
  - OpenAI article generation (title, description, content, keywords)
  - Auto-publish to Firestore
- Analytics:
  - Google Analytics script support
  - Custom page-view event collection to Firestore (`analytics_events`) with location headers on Vercel
- Monetization:
  - AdSense slot components (header, in-article, sidebar)
- Security:
  - Admin route protection with Next proxy
  - Basic rate limiting
  - Input sanitization on article/newsletter flows
- Deployment-ready:
  - Vercel-ready app
  - `vercel.json` hourly cron job
  - Firebase Functions scheduler scaffold (optional alternative scheduler)

---

## 1) Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill all required variables in `.env.local`.

4. Run development server:

```bash
npm run dev
```

5. Validate production build:

```bash
npm run build
```

---

## 2) Firebase Step-by-Step Setup

### A. Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create project**
3. Enable Google Analytics if you want integrated reporting

### B. Enable Firestore

1. In Firebase project, open **Firestore Database**
2. Click **Create database**
3. Start in production mode (recommended)
4. Choose nearest region

### C. Enable Authentication

1. Open **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Create one admin user in **Users** tab

### D. Create Web App config

1. Project settings > **General** > **Your apps** > Web app
2. Register app and copy config values
3. Paste values into:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### E. Create Service Account (Admin SDK)

1. Project settings > **Service accounts**
2. Click **Generate new private key**
3. From JSON key, map values to:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` must keep escaped new lines:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### F. Recommended Firestore collections

- `articles`
- `settings` (`automation`, `categories` docs)
- `analytics` (`summary` doc)
- `analytics_events`
- `newsletter_subscribers`

---

## 3) OpenAI + Automation Setup

1. Create API key at [OpenAI Platform](https://platform.openai.com/)
2. Set `OPENAI_API_KEY` in env
3. Set `CRON_SECRET` in env
4. Test automation manually:

```bash
curl -X POST http://localhost:3000/api/automation/run -H "x-cron-secret: YOUR_SECRET"
```

---

## 4) Vercel Deployment Step-by-Step

1. Push project to GitHub
2. Open [Vercel](https://vercel.com/) and click **Add New Project**
3. Import your GitHub repo
4. Framework preset should be **Next.js**
5. Add all variables from `.env.example` in Vercel Project Settings > Environment Variables
6. Set `NEXT_PUBLIC_SITE_URL` to your Vercel production domain
7. Deploy project
8. After deploy, verify:
   - `/sitemap.xml`
   - `/robots.txt`
   - `/admin/login`

### Vercel Cron

`vercel.json` already contains hourly cron:

- `0 * * * *` -> triggers `/api/automation/run`

Make sure `CRON_SECRET` exists in Vercel env and API route validates header.

---

## 5) Optional: Deploy Firebase Functions Scheduler

If you prefer Firebase Scheduler instead of Vercel Cron:

1. Install Firebase CLI:

```bash
npm i -g firebase-tools
```

2. Login and set project:

```bash
firebase login
firebase use <your-project-id>
```

3. Install functions deps:

```bash
cd firebase/functions
npm install
cd ../..
```

4. Set function secrets:

```bash
firebase functions:secrets:set TRENDPULSE_BASE_URL
firebase functions:secrets:set TRENDPULSE_CRON_SECRET
```

- `TRENDPULSE_BASE_URL` = your Vercel app URL
- `TRENDPULSE_CRON_SECRET` = same value as app `CRON_SECRET`

5. Deploy functions:

```bash
firebase deploy --only functions
```

---

## 6) Environment Variables

See `.env.example` for complete list.

Required for production:

- Site + analytics + ads:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_GA_ID`
  - `NEXT_PUBLIC_ADSENSE_CLIENT`
- Firebase client + admin SDK vars
- `OPENAI_API_KEY`
- `CRON_SECRET`

---

## 7) Remaining Optional Improvements (if you want)

- Rich WYSIWYG article editor in admin
- Full CTR dashboard aggregation charts
- Push notifications (FCM Web Push)
- Strong role-based admin claims check in Firebase Auth tokens
- Redis-based distributed rate limiting for high traffic
