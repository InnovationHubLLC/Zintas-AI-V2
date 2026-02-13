# Zintas AI — Production Deployment Guide

## Prerequisites

You need accounts with the following services:

| Service | Purpose | Dashboard |
|---------|---------|-----------|
| Vercel | Hosting & deployment | vercel.com/dashboard |
| Supabase | PostgreSQL database | supabase.com/dashboard |
| Clerk | Authentication & orgs | dashboard.clerk.com |
| Upstash | Redis rate limiting | console.upstash.com |
| Google Cloud | GSC, GA, GBP APIs | console.cloud.google.com |
| Resend | Transactional email | resend.com/emails |
| SE Ranking | SEO keyword tracking | online.seranking.com |
| Anthropic | AI content generation | console.anthropic.com |

## 1. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

### Clerk
- Create a Clerk application at dashboard.clerk.com
- Copy **Publishable Key** and **Secret Key**
- Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`
- Enable **Organizations** and create two roles: `practice_owner` and `manager`

### Supabase
- Create a new project at supabase.com
- Copy the **Project URL**, **Anon Key**, and **Service Role Key**
- Run the migration SQL (see Database Setup below)

### Google Cloud
- Create a project in Google Cloud Console
- Enable APIs: Google Search Console, Google Analytics Data, Google Business Profile
- Configure OAuth consent screen (external, production)
- Create OAuth 2.0 credentials (Web application)
- Set authorized redirect URI to `{APP_URL}/api/google/callback`

### Upstash Redis
- Create a Redis database at console.upstash.com
- Copy the **REST URL** and **REST Token**

### Resend
- Create an API key at resend.com
- Verify your sending domain

### Security Keys
- `ENCRYPTION_KEY`: Generate with `openssl rand -hex 32`
- `AGENT_API_KEY`: Generate with `openssl rand -hex 32`
- `RECAPTCHA_SECRET_KEY`: Create at google.com/recaptcha (v3)

## 2. Database Setup

In the Supabase SQL Editor, run the migration to create all tables:

```sql
-- Tables: practices, audits, geo_scores, content_items,
-- google_tokens, leads, agent_runs, weekly_reports
-- See packages/db/schema.ts for the full schema
```

Enable Row-Level Security (RLS) on all tables scoped by `org_id`.

## 3. Vercel Deployment

### First Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Add all environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
# ... repeat for all env vars

# Deploy to production
vercel --prod
```

### Domain Configuration

1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain (e.g., `app.zintas.ai`)
3. Configure DNS:
   - `A` record → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`

### GitHub Integration (recommended)

1. Connect your GitHub repository in Vercel dashboard
2. Set production branch to `main`
3. Vercel will auto-deploy on push to `main`

If using GitHub Actions instead, add these secrets to your repository:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 4. Clerk Configuration

1. Go to **Organizations** in Clerk dashboard
2. Create organization roles:
   - `practice_owner` — dental practice staff
   - `manager` — Zintas agency managers
3. Configure OAuth providers if needed (Google, etc.)
4. Set Clerk webhook endpoint to `{APP_URL}/api/webhooks/clerk`

## 5. Cron Jobs

Vercel Cron runs two scheduled jobs (configured in `vercel.json`):

| Job | Schedule | Path |
|-----|----------|------|
| Publish GBP posts | Every 30 minutes | `/api/cron/publish-gbp` |
| Weekly pipeline | Monday 6:00 AM UTC | `/api/cron/weekly-pipeline` |

Verify cron jobs are active in **Vercel > Settings > Cron Jobs**.

## 6. Pre-Deploy Verification

Run the production readiness checker:

```bash
bash scripts/setup-production.sh
```

This validates all environment variables and tests connectivity to Supabase and Redis.

## 7. Post-Deploy Checklist

After your first production deployment:

- [ ] Visit the app URL and verify the landing page loads
- [ ] Sign up as a new user via Clerk
- [ ] Create an organization with `manager` role
- [ ] Run an audit for a test practice
- [ ] Verify GBP cron fires (check Vercel function logs)
- [ ] Verify email delivery via Resend dashboard
- [ ] Check security headers at securityheaders.com
- [ ] Run Lighthouse audit (target: 90+ performance)

## CI/CD Pipeline

GitHub Actions runs on every push to `main` and on pull requests:

1. **CI** (`.github/workflows/ci.yml`): lint → typecheck → test → build
2. **Deploy** (`.github/workflows/deploy.yml`): build → deploy to Vercel production

All checks must pass before merging to `main`.
