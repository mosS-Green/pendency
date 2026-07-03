# Cloudflare Pages & Supabase Deployment Guide

Follow these step-by-step instructions to connect Supabase and go live on Cloudflare Pages.

---

## Step 1: Set up Supabase Database & Storage

1. Log in to [Supabase](https://supabase.com) and create a **New Project** named `construction-pendency-tracker`.
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Execute the SQL migration scripts located in `supabase/migrations/` in exact sequence:
   - **Script 1**: Paste and run `001_schema.sql` (Creates normalized Postgres tables, triggers, `v_pendency_dashboard` view, and indexes).
   - **Script 2**: Paste and run `002_seed.sql` (Seeds the 6 required departments, pendency lookup types, project 'Woods', towers, sample items, and CBE audit log).
   - **Script 3**: Paste and run `003_storage.sql` (Creates public storage bucket `pendency-attachments`).
   - **Script 4**: Paste and run `004_realtime.sql` (Enables Supabase Realtime publication on `pendencies`, `cbe_history`, and `pendency_comments`).
4. Retrieve your API credentials from **Project Settings → API**:
   - Copy **Project URL** (e.g. `https://xxxxxx.supabase.co`)
   - Copy **anon / public key** (the long JWT key string)

---

## Step 2: Deploy to Cloudflare Pages

### Option A: Via GitHub Connection (Recommended for CI/CD)

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Construction Pendency Tracker"
   git remote add origin https://github.com/YOUR_USERNAME/construction-pendency-tracker.git
   git push -u origin main
   ```
2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select your GitHub repository `construction-pendency-tracker`.
4. Configure Build Settings:
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
   - `NODE_VERSION`: `20`
6. Click **Save and Deploy**. Cloudflare Pages will build the static output and host it globally on Cloudflare's Edge network!

### Option B: Direct CLI Deployment via Wrangler

1. Install Wrangler globally or use `npx`:
   ```bash
   npx wrangler login
   ```
2. Build the Next.js app locally:
   ```bash
   npm run build
   ```
3. Deploy the `out/` static build directory directly:
   ```bash
   npx wrangler pages deploy out --project-name=construction-pendency-tracker
   ```

---

## Step 3: Verification Checklist

- [ ] Open your Cloudflare Pages URL in a browser.
- [ ] Enter your display name when prompted on first launch.
- [ ] Verify the executive dashboard loads with summary cards, department bar chart, donut chart, and trend line.
- [ ] Navigate to **All Pendencies** table and test 1-click inline editing of CBE dates, status toggles, and remarks.
- [ ] Click an item row to verify the slide-over drawer opens showing the **CBE Slippage Audit History**, comments thread, and file uploads.
- [ ] Open two browser tabs simultaneously, make an update in one, and verify the other tab updates live via Supabase Realtime!
- [ ] Click **Export XLSX** to verify spreadsheet downloads.
