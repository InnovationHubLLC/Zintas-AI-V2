# Zintas AI — Pilot Build Playbook

## FORBHARATHI.md

This is the document you keep open on your second monitor while building. The BRD tells you WHAT the pilot includes. The Pilot Playbook tells you HOW to run it. This document tells you HOW TO BUILD IT — every Bolt prompt, every LangGraph graph, every API route, every integration point.

**Three rules:**
1. **Bolt generates skeletons, Claude adds brains.** Generate each Bolt screen once. Export. Never go back to Bolt.
2. **LangGraph = state machines, not scripts.** Every agent is a graph with nodes and edges. State persists between nodes. If it crashes, it resumes from the last checkpoint.
3. **Compliance gates are NOT optional.** The compliance engine runs BEFORE content hits the queue. If it blocks, the content gets rewritten automatically. No human bypass.

---

## Week 1: Foundation

### 1.1 Monorepo Setup

```bash
# Create Next.js 14 monorepo
npx create-next-app@14 zintas-pilot --typescript --tailwind --eslint --app --src-dir=false
cd zintas-pilot

# Install core dependencies
npm install @clerk/nextjs @supabase/supabase-js @supabase/ssr
npm install @langchain/core @langchain/anthropic @langchain/langgraph
npm install @upstash/redis @upstash/ratelimit
npm install zod react-hook-form @hookform/resolvers
npm install recharts date-fns
npm install resend @react-email/components

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select table tabs badge dialog dropdown-menu sheet tooltip progress separator avatar
```

### 1.2 Route Group Structure

```
app/
├── (public)/
│   ├── page.tsx                    # Homepage + pricing
│   ├── audit/
│   │   └── page.tsx                # Free SEO audit tool
│   └── layout.tsx                  # Public layout (no auth)
├── (onboarding)/
│   ├── onboarding/
│   │   └── start/page.tsx          # 5-step onboarding wizard
│   └── layout.tsx                  # Auth required, no org yet
├── (practice)/
│   ├── practice/
│   │   ├── dashboard/page.tsx      # Practice dashboard
│   │   ├── content/page.tsx        # Content library
│   │   ├── reports/page.tsx        # Performance reports
│   │   └── settings/page.tsx       # Practice profile
│   └── layout.tsx                  # practice_owner role required
├── (manager)/
│   ├── dashboard/
│   │   ├── page.tsx                # Portfolio dashboard
│   │   ├── queue/page.tsx          # Global approval queue
│   │   ├── [client]/
│   │   │   ├── page.tsx            # Client overview
│   │   │   └── content/
│   │   │       └── [id]/
│   │   │           └── edit/page.tsx # Content editor
│   └── layout.tsx                  # manager role required
├── api/                            # All API routes (see BRD Section 3)
└── layout.tsx                      # Root layout with Clerk provider
```

### 1.3 Middleware (The Linchpin)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', '/audit(.*)', '/pricing', '/api/audit/free(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);
const isPracticeRoute = createRouteMatcher(['/practice(.*)']);
const isManagerRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Public routes — no auth needed
  if (isPublicRoute(request)) return;
  
  // Everything else requires auth
  const { userId, orgId, orgRole } = await auth();
  if (!userId) return auth().redirectToSignIn();
  
  // If authenticated but no org, redirect to onboarding
  if (!orgId && !isOnboardingRoute(request)) {
    return Response.redirect(new URL('/onboarding/start', request.url));
  }
  
  // Role-based portal routing
  if (isPracticeRoute(request) && orgRole === 'org:manager') {
    return Response.redirect(new URL('/dashboard', request.url));
  }
  if (isManagerRoute(request) && orgRole === 'org:practice_owner') {
    return Response.redirect(new URL('/practice/dashboard', request.url));
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

### 1.4 Supabase Schema Migration

```sql
-- supabase/migrations/001_pilot_schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE management_mode AS ENUM ('managed', 'self_service');
CREATE TYPE content_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'rejected');
CREATE TYPE content_type AS ENUM ('blog_post', 'service_page', 'faq', 'gbp_post');
CREATE TYPE compliance_status AS ENUM ('pass', 'warn', 'block');
CREATE TYPE action_status AS ENUM ('pending', 'approved', 'rejected', 'deployed', 'rolled_back');
CREATE TYPE severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE agent_name AS ENUM ('conductor', 'scholar', 'ghostwriter', 'analyst');
CREATE TYPE run_status AS ENUM ('running', 'paused', 'completed', 'failed');
CREATE TYPE gbp_post_status AS ENUM ('draft', 'scheduled', 'published');
CREATE TYPE account_health AS ENUM ('active', 'disconnected', 'error');

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  management_mode management_mode DEFAULT 'managed',
  vertical TEXT DEFAULT 'dental',
  health_score INTEGER DEFAULT 0,
  practice_profile JSONB DEFAULT '{}',
  google_tokens JSONB DEFAULT '{}',
  cms_type TEXT,
  cms_credentials JSONB DEFAULT '{}',
  account_health account_health DEFAULT 'active',
  competitors JSONB DEFAULT '[]',
  onboarding_step INTEGER,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content pieces
CREATE TABLE content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body_html TEXT,
  body_markdown TEXT,
  content_type content_type NOT NULL,
  status content_status DEFAULT 'draft',
  target_keyword TEXT,
  related_keywords JSONB DEFAULT '[]',
  seo_score INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  compliance_status compliance_status DEFAULT 'pass',
  compliance_details JSONB DEFAULT '[]',
  meta_title TEXT,
  meta_description TEXT,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  current_position INTEGER,
  previous_position INTEGER,
  best_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  difficulty INTEGER DEFAULT 0,
  keyword_type TEXT DEFAULT 'tracked',
  source TEXT DEFAULT 'manual',
  serp_features JSONB DEFAULT '[]',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent actions (approval queue)
CREATE TABLE agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent agent_name NOT NULL,
  action_type TEXT NOT NULL,
  autonomy_tier INTEGER NOT NULL DEFAULT 2,
  status action_status DEFAULT 'pending',
  severity severity DEFAULT 'info',
  description TEXT NOT NULL,
  proposed_data JSONB DEFAULT '{}',
  rollback_data JSONB DEFAULT '{}',
  content_piece_id UUID REFERENCES content_pieces(id),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (no RLS — anonymous access via API)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  email TEXT,
  audit_score INTEGER,
  audit_results JSONB DEFAULT '{}',
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMPTZ,
  source TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GBP posts
CREATE TABLE gbp_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  post_type TEXT DEFAULT 'update',
  title TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  cta_type TEXT,
  cta_url TEXT,
  status gbp_post_status DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  gbp_post_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agent agent_name NOT NULL,
  graph_id TEXT,
  status run_status DEFAULT 'running',
  trigger TEXT DEFAULT 'manual',
  config JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  checkpoint_data JSONB DEFAULT '{}'
);

-- RLS policies (all tables except leads)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- Generic RLS policy for each table
CREATE POLICY "org_isolation" ON clients FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON content_pieces FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON keywords FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON agent_actions FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON gbp_posts FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));
CREATE POLICY "org_isolation" ON agent_runs FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id'));

-- Indexes
CREATE INDEX idx_agent_actions_status ON agent_actions(status, org_id);
CREATE INDEX idx_agent_actions_client ON agent_actions(client_id, status);
CREATE INDEX idx_content_pieces_client ON content_pieces(client_id, status);
CREATE INDEX idx_keywords_client ON keywords(client_id, keyword_type);
CREATE INDEX idx_keywords_position ON keywords(client_id, current_position);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_domain ON leads(domain);
CREATE INDEX idx_gbp_posts_scheduled ON gbp_posts(scheduled_at) WHERE status = 'scheduled';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER content_pieces_updated_at BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 1.5 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...
SE_RANKING_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://zintas.ai/api/onboarding/google-oauth/callback

UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

RESEND_API_KEY=re_...
RECAPTCHA_SECRET_KEY=...
ENCRYPTION_KEY=... # 32-byte hex for AES-256-GCM
AGENT_API_KEY=... # Server-to-server agent auth

NEXT_PUBLIC_APP_URL=https://zintas.ai
```

**Week 1 Exit Criteria:** Monorepo runs locally. Supabase schema deployed. Clerk configured with two roles. Middleware routing works (manager → /dashboard, practice_owner → /practice). CI/CD deploys to Vercel.

---

## Week 2: Bolt Scaffolding — All 11 Screens

Generate each screen one at a time. Copy the output. Do NOT iterate inside Bolt. 

### Bolt Screen 1 — Homepage + Pricing (/)

```
Create a Next.js 14 marketing landing page using shadcn/ui and Tailwind CSS.

HERO SECTION:
- Large headline: "Stop Paying $5,000/month for Dental Marketing"
- Subheadline: "AI-powered marketing that grows your practice for $299/month.
  No agency. No guesswork. No contracts."
- Two CTA buttons: "Start Free Trial" (primary blue #1E40AF) and
  "Get Free SEO Audit" (outline)
- Right side: dashboard mockup screenshot or abstract gradient shape

HOW IT WORKS SECTION:
- 3-step horizontal flow with numbered circles:
  1. "Connect Your Practice" — "Enter your website URL. We handle the rest."
  2. "AI Analyzes & Optimizes" — "Our AI team audits your site, researches
     keywords, and creates content."
  3. "Watch Your Practice Grow" — "Track new patients, rankings, and ROI
     in your dashboard."

FEATURES SECTION:
- 3-column card grid:
  Card 1: "Autonomous SEO" — "Technical audits, fixes, and monitoring
    running 24/7. Issues fixed before you even know about them."
  Card 2: "AI Content Engine" — "Blog posts, service pages, and FAQ content
    written specifically for your practice and specialties."
  Card 3: "Smart Analytics" — "See exactly how many new patients your
    marketing generates. Plain English, not jargon."

SOCIAL PROOF SECTION:
- "Trusted by 500+ dental practices" with 5 placeholder logo slots
- 3 testimonial cards with name, practice name, star rating, quote

PRICING SECTION:
- 3-tier pricing cards side by side:
  Starter ($299/mo): "1 location, SEO audit + auto-fix, 5 blog posts/month,
    50 keyword tracking, monthly reports, email support"
  Pro ($499/mo, highlighted with "Most Popular" badge):
    "Up to 3 locations, unlimited content, advanced keyword research,
    competitor intelligence, GEO optimization, weekly reports, priority support"
  Enterprise (Custom): "Unlimited locations, dedicated account manager,
    custom integrations, SLA guarantees, phone support"
- "All plans include a 14-day free trial" badge below cards
- Below pricing: ROI Calculator section with:
  Three input sliders: "Average patient lifetime value" ($1000-$10000),
    "Current monthly new patients" (1-50),
    "Target monthly growth" (10%-100%)
  Output card: "Estimated monthly ROI: $X,XXX" and
    "vs. Agency cost: You save $X,XXX/month"

FAQ SECTION:
- Accordion component with 6 questions about AI, dental marketing, pricing

FOOTER:
- Logo, nav links, "Start Free Trial" CTA, copyright

Color scheme: primary blue #1E40AF, accent green #059669, dark text #1F2937.
Professional, trustworthy, medical feel. Fully responsive.
```

### Bolt Screen 2 — Free SEO Audit Tool (/audit)

```
Create a Next.js 14 page for a free SEO audit tool using shadcn/ui
and Tailwind CSS. This is a lead capture tool.

STEP 1 - INPUT FORM:
- Clean centered card on a light background
- Headline: "Get Your Free SEO Audit in 60 Seconds"
- Subheadline: "See how your dental practice website performs in
  Google search"
- Input field: "Your website URL" (with placeholder: www.example.com)
- Input field: "Your email address"
- Large button: "Run My Free Audit" (blue #1E40AF)
- Small text below: "No credit card required. No spam."
- Trust badges: "256-bit encryption", "Used by 500+ practices"

STEP 2 - SCANNING STATE:
- Same card, now showing a progress animation
- "Analyzing your website..." with animated progress bar
- Checklist appearing one by one with animated checkmarks:
  "Checking mobile friendliness..." ✓
  "Measuring page speed..." ✓
  "Analyzing meta tags..." ✓
  "Scanning for schema markup..." ✓
  "Checking Google Business Profile..." ✓
- Progress bar going from 0% to 100%

STEP 3 - RESULTS:
- Audit score at top: large circular gauge showing score out of 100
  (color coded: red <50, yellow 50-75, green >75)
- Grade badge: A/B/C/D/F
- 6 finding cards in 2-column grid, each showing:
  - Category icon (mobile, speed, meta, schema, GBP, security)
  - Category name
  - Pass/Fail/Warning badge (green check, red X, yellow triangle)
  - One-line finding text
  - One-line recommendation text
- Summary section: "Your practice is missing out on an estimated X
  potential patients per month"
- BIG CTA at bottom: "Fix These Automatically — Start Your Free Trial"
  (green #059669, full width button)
- Secondary link: "Email me this report"

Design should feel clinical and professional. Use subtle animations
for the scanning step.
```

### Bolt Screen 3 — Onboarding Wizard (/onboarding/start)

```
Create a Next.js 14 multi-step onboarding wizard for dental practices
using shadcn/ui and Tailwind CSS. This is for self-service signups
with ZERO technical knowledge.

PROGRESS BAR (sticky top):
- 5 steps with labels, connected by line
- Steps: "Your Practice" → "Connect Google" → "Competitors" →
  "Choose Plan" → "Launch!"
- Current step highlighted blue, completed steps green with
  checkmark, future steps gray
- Step number inside circle

STEP 1 — YOUR PRACTICE:
- Friendly headline: "Tell us about your practice"
- Fields:
  Practice name (text input)
  Website URL (text input with placeholder "www.yourpractice.com")
  What type of practice? (large icon cards to select):
    General Dentistry (tooth icon)
    Orthodontics (braces icon)
    Cosmetic Dentistry (sparkle icon)
    Pediatric Dentistry (child icon)
    Oral Surgery (medical icon)
    Other (plus icon, shows text input)
  Practice location (address autocomplete input)
- "Next" button (blue, right-aligned)

STEP 2 — CONNECT GOOGLE:
- Headline: "Connect your Google accounts"
- Subtitle: "One click connects everything. We'll never post
  without your permission."
- Large "Connect with Google" button (Google colors + G logo)
- Below button, 3 items showing what will be connected:
  "Google Business Profile" — "Manage your listing and reviews"
  "Google Search Console" — "See how people find you"
  "Google Analytics" — "Track your website visitors"
- Each shows a status indicator after connection:
  Green check "Connected" or Gray "Not yet connected"
- "Why do we need this?" expandable FAQ
- "Skip for now" link (but shows warning that features will
  be limited)
- Auto-detect CMS section: "We detected your website runs on
  [WordPress/Wix/Other]" with connect instructions or
  plugin install button for WordPress

STEP 3 — COMPETITORS:
- Headline: "Here are dental practices near you"
- Subtitle: "We'll track how you compare. Add or remove as needed."
- Auto-suggested competitor cards (3-5), each showing:
  Practice name, domain URL, distance from your location
  Checkbox (pre-selected)
  "Remove" X button
- "Add another competitor" button (shows URL input)
- Maximum 5 competitors indicator: "3 of 5 selected"

STEP 4 — CHOOSE PLAN:
- Headline: "Choose your plan"
- Subtitle: "All plans include a 14-day free trial. No charge today."
- 3 pricing cards (same as marketing page pricing section):
  Starter $299/mo, Pro $499/mo (recommended badge), Enterprise
- Selected plan has blue border + checkmark
- Below cards: "You won't be charged until your trial ends"

STEP 5 — LAUNCH:
- Headline: "You're all set! 🎉"
- Summary card showing:
  Practice name, website URL, plan selected, competitors count,
  Google accounts connected (with status)
- Large green button: "Launch My AI Marketing Team"
- Below: "What happens next?" expandable:
  "In the next 24 hours, your AI team will:
   1. Run a complete keyword analysis for your practice
   2. Research your competitors' strategies
   3. Start writing your first blog posts
   4. Begin optimizing your Google Business Profile
   You'll get an email when your first results are ready!"

Friendly, encouraging, non-technical. Mobile responsive.
```

### Bolt Screen 4 — Practice Dashboard (/practice/dashboard)

```
Create a Next.js 14 dashboard page for dental practice owners using
shadcn/ui and Tailwind CSS. This dashboard must use ZERO technical
jargon — the user is a dentist, not a marketer. READ-ONLY for pilot.

TOP BAR:
- Left: Zintas logo + practice name
- Right: user avatar dropdown menu

KPI CARDS ROW (4 cards):
- Card 1: "People Who Found You" — large number (e.g., "2,847"),
  trend arrow (green up or red down) with percentage change,
  sparkline chart underneath, subtitle "in Google search this month"
- Card 2: "Rankings Improving" — large number (e.g., "23"),
  subtitle "keywords moving up in Google"
- Card 3: "Content Published" — large number (e.g., "4"),
  subtitle "blog posts this month"
- Card 4: "Website Health" — circular progress gauge showing score
  (0-100, color coded), subtitle "technical health score"

RECENT WINS SECTION:
- Section header: "Recent Wins" with green checkmark
- Vertical timeline of 5 recent positive events:
  "Your ranking for 'dentist near me' improved from #8 to #3"
  "We published 'Top 5 Tips for Healthier Gums'"
  "Your Google Business Profile got 12 more views this week"
  "New blog post is getting 150 views per week"
  "A patient left a 5-star review mentioning your website"
- Each item has a green dot, timestamp, and relevant icon

PERFORMANCE CHART:
- Line chart: "People Finding Your Practice" over 6 months
  (Recharts, blue line, area fill)
- Y-axis label: "Monthly visitors from Google"

Warm, friendly design. Green accents for positive metrics.
Mobile responsive — dentists check this on their phones.
NO approval cards, NO action items — this is purely read-only.
```

### Bolt Screen 5 — Practice Content Library (/practice/content)

```
Create a Next.js 14 content library page for dental practices using
shadcn/ui and Tailwind CSS. READ-ONLY — dentists view content, not manage it.

TOP BAR:
- Page title: "Your Content"
- Filter tabs: "All", "Published" (with count), "In Progress"
- Search input field
- Toggle: grid view / list view icons

CONTENT CARDS (grid view, 2 columns desktop, 1 mobile):
Each card shows:
- Status badge: "Published" (green), "In Progress" (yellow)
- Content type tag: "Blog Post", "Service Page", "FAQ"
- Title (bold, 2 lines max with ellipsis)
- Preview snippet: first 2 lines in gray
- Bottom row: publish date, word count, target keyword tag
- On hover: slight shadow lift

LIST VIEW:
- Table: Title, Type, Status, Date, Keywords
- Sortable by any column

EMPTY STATE:
- "Your AI team is researching your first content pieces"
- "You'll see them here once they're published"

Clean, Pinterest-style card grid. No edit buttons — read-only.
```

### Bolt Screen 6 — Practice Reports (/practice/reports)

```
Create a Next.js 14 performance reports page for dental practice
owners using shadcn/ui and Tailwind CSS. Business language only.

METRICS ROW (4 cards):
- "People Who Found You": 2,847 (↑ 18% vs last month)
- "Rankings Improving": 23 keywords moving up
- "Content Published": 8 posts total
- "Keywords on Page 1": 5 (↑ 3 new this month)

CHARTS SECTION:
- Tab navigation: "Traffic", "Rankings", "Content"

Traffic tab:
- Line chart: "People Finding Your Practice" over 6 months
  (Recharts, blue area fill)

Rankings tab:
- Horizontal bar chart grouped by position:
  "Page 1 (Top 10)": 5 keywords (green)
  "Page 2 (11-20)": 12 keywords (yellow)
  "Page 3+ (21+)": 8 keywords (gray)
- Table: keyword, position, change arrow, monthly searches

Content tab:
- Card list: title, publish date, views this month
  Sorted by performance

NO jargon: no impressions, CTR, backlinks, domain authority.
Green for positive trends. Warm, business-focused.
```

### Bolt Screen 7 — Settings / Practice Profile (/practice/settings)

```
Create a Next.js 14 settings page for dental practices using
shadcn/ui and Tailwind CSS.

TAB NAVIGATION:
- Tabs: "Practice Profile" | "Doctors" | "Services" | "Locations" |
  "Connected Accounts"

PRACTICE PROFILE TAB:
- Practice name input
- Website URL (read-only with "Change" link)
- Vertical/specialty dropdown
- Practice description textarea
- "Save Changes" button

DOCTORS TAB:
- Card list of doctors with:
  Name, Title (DDS, DMD), Specialization multi-select
  NPI Number input (with validation indicator)
  Short bio textarea, "Remove" button
- "+ Add Doctor" button

SERVICES TAB:
- Checkbox grid grouped by category:
  General: Cleanings, Fillings, Root Canals, Extractions, Crowns
  Cosmetic: Teeth Whitening, Veneers, Bonding
  Orthodontics: Braces, Invisalign
  Surgical: Dental Implants, Wisdom Teeth
  Pediatric: Sealants, Fluoride
  Emergency: Emergency Care, Toothache
- "Other services" text input
- "Save" button

LOCATIONS TAB:
- Card list: Address, Phone, Hours (Mon-Sun grid)
  "Primary Location" radio, "Remove" button
- "+ Add Location" button

CONNECTED ACCOUNTS TAB:
- Cards for Google Business Profile, Search Console, Analytics, CMS
- Each: status, connected email, "Reconnect" button
- Last sync timestamp

Standard settings page. Clean forms.
```

### Bolt Screen 8 — Portfolio Dashboard (/dashboard)

```
Create a Next.js 14 portfolio dashboard for agency Account Managers
using shadcn/ui and Tailwind CSS. Information-dense ops screen.

SIDEBAR (dark, 240px):
- Zintas logo (white on dark)
- Nav links with icons:
  "Portfolio" (active), "Approval Queue" (red badge count),
  "Onboard Client" (plus icon), "Leads" (new), "Settings"
- Bottom: user avatar + name + role badge ("Manager")

TOP BAR:
- Search bar: "Search clients..."
- Filters: "All", "Critical Health", "Has Pending Items"

METRICS ROW (4 cards):
- "Total Clients": number
- "Pending Items": count (orange/red)
- "Average Health Score": gauge
- "Audit Tool Leads": count (this week)

CLIENT GRID (3 columns desktop):
Each card:
- Client name + domain URL
- Health score circular badge (color coded)
- Pending items orange badge (CLICKABLE → queue filtered)
- Last activity timestamp
- Management mode tag ("Self-Service" / "Managed")
- Quick action icons: audit, content, settings

Dense, professional. Linear/Vercel dashboard feel.
```

### Bolt Screen 9 — Global Approval Queue (/dashboard/queue)

```
Create a Next.js 14 approval queue page for agency managers using
shadcn/ui and Tailwind CSS. MOST CRITICAL screen — 50+ items daily.

FILTER BAR (sticky top):
- Client dropdown (searchable), Severity dropdown (All/Critical/Warning/Info),
  Type dropdown (All/Content/Technical/Redirect/Schema/Meta),
  Date range picker
- Active filters as dismissible chips
- "Clear All" link, result count, sort dropdown

DATA TABLE (Tanstack Table style):
- Columns: Checkbox, Client Name (sortable, links to client),
  Action Type (colored badge), Description (truncated),
  Severity (colored dot), Created (relative timestamp),
  Actions (Approve/Reject/Edit icon buttons)
- Row click: expands inline detail with full description,
  code diff view (green additions, red deletions),
  compliance badge, full action buttons

BULK SELECTION:
- Header checkbox for "Select All Visible"
- Floating action bar: "X selected" + "Approve Selected" +
  "Reject Selected"

KEYBOARD SHORTCUTS (tooltip on "?"):
- j/k: navigate, a: approve, r: reject, e: edit,
  /: focus search, x: toggle selection

EMPTY STATE:
- Green checkmark, "No pending items"

25 items/page. Pagination. URL-persistent filters
(?client=&severity=&type=).
```

### Bolt Screen 10 — Client Overview (/dashboard/[client])

```
Create a Next.js 14 client detail page for agency managers using
shadcn/ui and Tailwind CSS.

CLIENT HEADER:
- Left: name (h1), domain (external link), management mode tag
- Center: Health score large gauge (0-100, color coded)
- Right: "Run Audit" + "Generate Content" + "View as Client" buttons

STATS ROW (4 cards):
- "Organic Traffic": number + trend arrow + sparkline
- "Keywords Ranked": number + improved count
- "Content Published": month count + total
- "GBP Views": number + trend

PENDING ACTIONS WIDGET (yellow background):
- "Pending Actions" + count badge
- List of 3-5 items: type icon, severity dot, description, age
- Quick approve/reject buttons per item
- "Review All →" button (links to queue filtered by client)

RECENT ACTIVITY TIMELINE:
- Last 10 agent actions with icons:
  "Ghostwriter: drafted 'Dental Implant Guide'" etc.
- Agent name, action, timestamp, status icon

NAVIGATION TABS: Keywords | Content | GBP | Analytics | Settings

Dense but scannable. Pending widget must visually stand out.
```

### Bolt Screen 11 — Content Editor (/dashboard/[client]/content/[id]/edit)

```
Create a Next.js 14 split-panel content editor for agency managers
using shadcn/ui and Tailwind CSS. Three-column layout.

LEFT PANEL (280px, scrollable, light gray):
- "Content Brief" header with Scholar icon
- Collapsible sections:
  "Target Keyword": keyword + volume + difficulty bar
  "Related Keywords": tag list (5-8)
  "Competitor Analysis": 3 cards (URL, word count, angle)
  "Suggested Structure": H1, H2s (4-5), H3s
  "Internal Links": 3-5 pages with anchor text
  "Compliance Notes": dental-specific reminders

CENTER PANEL (flexible, white):
- Toolbar: bold, italic, headings, lists, link, image,
  undo/redo, "Regenerate with AI" button
- Rich text editor area (Tiptap placeholder)
- Bottom: word count, reading time, compliance badge

RIGHT PANEL (260px, scrollable, light gray):
- "SEO Score" gauge (0-100)
- Checklist: keyword in title ✓/✗, keyword in first paragraph,
  density, readability, meta title length, meta description length,
  internal links count, heading structure, images with alt text
- "Compliance Warnings" section if any flagged phrases

META FIELDS (collapsible bottom bar):
- Meta Title input (X/70 chars), Meta Description (X/160),
  Google SERP preview card

ACTION BAR (sticky bottom):
- "Last saved: 2 min ago"
- "Save Draft" | "Request AI Revisions" | "Approve & Publish"

Professional editor. Notion meets WordPress. Resizable panels.
```

**Week 2 Exit Criteria:** All 11 screens generated, exported from Bolt, imported into monorepo route groups. Mock data visible. No API connections yet.

---

## Week 3: Marketing Site + Free Audit Engine

### 3.1 Wire Homepage

Replace Bolt's static pricing data with your real tier configuration. Add the ROI calculator logic:

```typescript
// app/(public)/components/roi-calculator.tsx
'use client';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

export function ROICalculator() {
  const [patientValue, setPatientValue] = useState(3000);
  const [currentPatients, setCurrentPatients] = useState(10);
  const [growthTarget, setGrowthTarget] = useState(30); // percent

  const additionalPatients = Math.round(currentPatients * (growthTarget / 100));
  const monthlyROI = additionalPatients * patientValue;
  const agencyCost = 4200; // average agency cost
  const zintasCost = 499;
  const savings = agencyCost - zintasCost;

  return (
    <div className="space-y-8">
      <SliderField label="Average patient lifetime value"
        value={patientValue} min={1000} max={10000} step={500}
        format={v => `$${v.toLocaleString()}`}
        onChange={setPatientValue} />
      <SliderField label="Current monthly new patients"
        value={currentPatients} min={1} max={50}
        onChange={setCurrentPatients} />
      <SliderField label="Target monthly growth"
        value={growthTarget} min={10} max={100} step={5}
        format={v => `${v}%`}
        onChange={setGrowthTarget} />
      <Card className="bg-green-50 p-6 text-center">
        <p className="text-sm text-gray-600">Estimated monthly value</p>
        <p className="text-4xl font-bold text-green-700">
          ${monthlyROI.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          vs. Agency cost: You save ${savings.toLocaleString()}/month
        </p>
      </Card>
    </div>
  );
}
```

### 3.2 Free Audit Engine Backend

```typescript
// app/api/audit/free/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1h'), // 3 audits/hour/IP
});

const schema = z.object({
  url: z.string().url(),
  email: z.string().email().optional(),
  recaptchaToken: z.string(),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);
  if (!success) return Response.json({ error: 'Rate limited' }, { status: 429 });

  const body = schema.parse(await req.json());
  // TODO: verify recaptchaToken with Google

  // Run all checks in parallel
  const [mobile, speed, meta, schema_markup, gbp, ssl] = await Promise.all([
    checkMobileFriendly(body.url),
    checkPageSpeed(body.url),
    checkMetaTags(body.url),
    checkSchemaMarkup(body.url),
    checkGBP(body.url),
    checkSSL(body.url),
  ]);

  const findings = [mobile, speed, meta, schema_markup, gbp, ssl];
  const totalScore = findings.reduce((sum, f) => sum + f.score, 0);
  const grade = totalScore >= 90 ? 'A' : totalScore >= 75 ? 'B' :
                totalScore >= 60 ? 'C' : totalScore >= 40 ? 'D' : 'F';

  // Store lead
  const ipHash = createHash('sha256').update(ip).digest('hex');
  const { data: lead } = await supabaseAdmin.from('leads').insert({
    domain: body.url,
    email: body.email || null,
    audit_score: totalScore,
    audit_results: { findings, grade },
    source: req.headers.get('referer') || 'direct',
    ip_hash: ipHash,
  }).select('id').single();

  // If email provided, send results email
  if (body.email) {
    await sendAuditResultsEmail(body.email, { url: body.url, score: totalScore, grade, findings });
  }

  return Response.json({ id: lead.id, score: totalScore, grade, findings });
}

async function checkPageSpeed(url: string) {
  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`
  );
  const data = await res.json();
  const perfScore = Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100);
  return {
    category: 'Page Speed',
    icon: 'zap',
    score: Math.round(perfScore * 0.2), // max 20 points
    status: perfScore >= 70 ? 'pass' : perfScore >= 50 ? 'warning' : 'fail',
    finding: `Mobile speed score: ${perfScore}/100`,
    recommendation: perfScore < 70 ? 'Compress images and reduce JavaScript to improve load time' : 'Good mobile performance',
  };
}

async function checkMobileFriendly(url: string) {
  // Use PageSpeed Insights mobile usability from same API call
  const res = await fetch(
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=accessibility`
  );
  const data = await res.json();
  const score = Math.round((data.lighthouseResult?.categories?.accessibility?.score || 0) * 100);
  const pass = score >= 70;
  return {
    category: 'Mobile Friendly',
    icon: 'smartphone',
    score: pass ? 15 : 5,
    status: pass ? 'pass' : 'fail',
    finding: pass ? 'Site is mobile-friendly' : 'Mobile usability issues detected',
    recommendation: pass ? 'Your site works well on phones' : 'Fix viewport and tap target issues for mobile users',
  };
}

async function checkMetaTags(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ZintasBot/1.0' } });
  const html = await res.text();
  const hasTitle = /<title[^>]*>.+<\/title>/i.test(html);
  const hasDesc = /<meta[^>]*name=["']description["'][^>]*>/i.test(html);
  const hasOG = /<meta[^>]*property=["']og:/i.test(html);
  const score = (hasTitle ? 5 : 0) + (hasDesc ? 5 : 0) + (hasOG ? 5 : 0);
  return {
    category: 'Meta Tags',
    icon: 'tag',
    score,
    status: score >= 10 ? 'pass' : score >= 5 ? 'warning' : 'fail',
    finding: `Found: ${[hasTitle && 'title', hasDesc && 'description', hasOG && 'OG tags'].filter(Boolean).join(', ') || 'none'}`,
    recommendation: score < 15 ? 'Add missing meta tags to improve how your site appears in Google' : 'Good meta tag coverage',
  };
}

async function checkSchemaMarkup(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ZintasBot/1.0' } });
  const html = await res.text();
  const hasJsonLd = /application\/ld\+json/i.test(html);
  const hasDentalSchema = /Dentist|MedicalBusiness|LocalBusiness/i.test(html);
  return {
    category: 'Schema Markup',
    icon: 'code',
    score: hasDentalSchema ? 10 : hasJsonLd ? 5 : 0,
    status: hasDentalSchema ? 'pass' : hasJsonLd ? 'warning' : 'fail',
    finding: hasDentalSchema ? 'Dental-specific schema found' : hasJsonLd ? 'Basic schema found, no dental markup' : 'No schema markup detected',
    recommendation: !hasDentalSchema ? 'Add dental practice schema to help Google understand your business' : 'Good structured data',
  };
}

async function checkGBP(url: string) {
  // Simplified: check if domain appears in Google Places
  // In production, use Places API text search
  return {
    category: 'Google Business Profile',
    icon: 'map-pin',
    score: 5, // Partial credit — full check needs Places API
    status: 'warning',
    finding: 'Google Business Profile check requires manual verification',
    recommendation: 'Ensure your Google Business Profile is claimed and fully completed',
  };
}

async function checkSSL(url: string) {
  const isHttps = url.startsWith('https://');
  return {
    category: 'Security (SSL)',
    icon: 'shield',
    score: isHttps ? 5 : 0,
    status: isHttps ? 'pass' : 'fail',
    finding: isHttps ? 'Site uses HTTPS' : 'Site does not use HTTPS',
    recommendation: isHttps ? 'Good — secure connection' : 'Switch to HTTPS to protect visitors and improve rankings',
  };
}
```

**Week 3 Exit Criteria:** Marketing site live with real copy. Free audit tool runs scans and stores leads. ROI calculator works. Resend sends audit results emails.

---

## Week 4: Auth + Self-Service Onboarding

### 4.1 Google OAuth Multi-Scope

```typescript
// app/api/onboarding/google-oauth/route.ts
import { auth } from '@clerk/nextjs/server';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', userId); // for callback verification

  return Response.json({ url: authUrl.toString() });
}

// app/api/onboarding/google-oauth/callback/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: code!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();

  // Encrypt and store tokens
  const encrypted = encryptTokens(tokens);
  await supabaseAdmin.from('clients')
    .update({ google_tokens: encrypted, account_health: 'active' })
    .eq('org_id', await getOrgIdForUser(userId));

  // Redirect back to onboarding
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/onboarding/start?step=3&google=connected`);
}
```

### 4.2 CMS Auto-Detection

```typescript
// packages/audit-engine/detect-cms.ts
export async function detectCMS(domain: string): Promise<CMSResult> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ZintasBot/1.0' },
      redirect: 'follow',
    });
    const html = await res.text();
    const headers = Object.fromEntries(res.headers.entries());

    // WordPress detection
    if (html.includes('wp-content') || html.includes('wp-includes') ||
        headers['x-powered-by']?.includes('WordPress')) {
      // Try to verify REST API
      const apiCheck = await fetch(`${url}/wp-json/wp/v2/posts?per_page=1`).catch(() => null);
      return {
        cms: 'wordpress',
        confidence: 'high',
        api_available: apiCheck?.ok ?? false,
        setup_instructions: apiCheck?.ok
          ? 'Your WordPress REST API is accessible. We just need an application password.'
          : 'We detected WordPress but the REST API may be restricted. Check your security plugin settings.',
      };
    }

    // Wix detection
    if (html.includes('wix.com') || html.includes('X-Wix-')) {
      return { cms: 'wix', confidence: 'high', api_available: false,
        setup_instructions: 'We detected Wix. We can publish content via the Wix API — you\'ll need to connect your Wix account.' };
    }

    // Squarespace detection
    if (html.includes('squarespace.com') || html.includes('sqsp')) {
      return { cms: 'squarespace', confidence: 'medium', api_available: false,
        setup_instructions: 'We detected Squarespace. Content publishing requires manual steps for now.' };
    }

    return { cms: 'unknown', confidence: 'low', api_available: false,
      setup_instructions: 'We couldn\'t auto-detect your CMS. Please select it manually.' };
  } catch (e) {
    return { cms: 'error', confidence: 'none', api_available: false,
      setup_instructions: 'We couldn\'t reach your website. Please verify the URL.' };
  }
}
```

**Week 4 Exit Criteria:** Clerk auth works. Self-service signup → onboarding wizard → Google OAuth → CMS detection → client record created. New signups appear in Manager portfolio. Role-based routing functional.

---

## Week 5: Scholar Agent (LangGraph)

### 5.1 Scholar Graph Definition

```typescript
// packages/agents/scholar/graph.ts
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { seRankingClient } from '../integrations/se-ranking';
import { gscClient } from '../integrations/google-search-console';
import { supabaseAdmin } from '../../db/admin';

// State definition
const ScholarState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  practiceProfile: Annotation<Record<string, any>>,
  gscData: Annotation<any[]>,
  researchedKeywords: Annotation<any[]>,
  competitorKeywords: Annotation<any[]>,
  gapAnalysis: Annotation<any[]>,
  prioritizedKeywords: Annotation<any[]>,
  contentTopics: Annotation<any[]>,
  error: Annotation<string | null>,
});

// Node implementations
async function fetchGSCData(state: typeof ScholarState.State) {
  const client = await supabaseAdmin.from('clients').select('google_tokens').eq('id', state.clientId).single();
  const tokens = decryptTokens(client.data.google_tokens);
  
  const queries = await gscClient.getTopQueries(tokens, {
    startDate: daysAgo(90),
    endDate: today(),
    rowLimit: 500,
  });
  
  return { gscData: queries };
}

async function researchKeywords(state: typeof ScholarState.State) {
  const { practiceProfile } = state;
  const location = practiceProfile.locations?.[0]?.city || '';
  const services = practiceProfile.services || [];
  
  // Generate seed keywords from practice profile
  const seeds = services.flatMap(service => [
    `${service} ${location}`,
    `${service} near me`,
    `best ${service} ${location}`,
    `${service} cost ${location}`,
  ]);
  
  // Research via SE Ranking
  const results = await seRankingClient.bulkKeywordResearch(seeds);
  
  return { researchedKeywords: results };
}

async function analyzeCompetitors(state: typeof ScholarState.State) {
  const client = await supabaseAdmin.from('clients')
    .select('competitors').eq('id', state.clientId).single();
  
  const competitorData = await Promise.all(
    (client.data.competitors || []).map(async (comp: any) => {
      const keywords = await seRankingClient.getCompetitorKeywords(comp.domain);
      return { ...comp, keywords };
    })
  );
  
  return { competitorKeywords: competitorData };
}

async function runGapAnalysis(state: typeof ScholarState.State) {
  const myKeywords = new Set([
    ...state.gscData.map(q => q.query),
    ...state.researchedKeywords.map(k => k.keyword),
  ]);
  
  const gaps = state.competitorKeywords.flatMap(comp =>
    comp.keywords
      .filter(k => !myKeywords.has(k.keyword) && k.volume > 50)
      .map(k => ({ ...k, competitor: comp.name }))
  );
  
  return { gapAnalysis: gaps.sort((a, b) => b.volume - a.volume).slice(0, 50) };
}

async function prioritizeAndRecommend(state: typeof ScholarState.State) {
  const claude = new ChatAnthropic({ model: 'claude-sonnet-4-5-20250929' });
  
  const allKeywords = [
    ...state.researchedKeywords.map(k => ({ ...k, source: 'research' })),
    ...state.gapAnalysis.map(k => ({ ...k, source: 'gap' })),
  ];
  
  const response = await claude.invoke([{
    role: 'user',
    content: `You are an SEO strategist for a dental practice.

Practice profile:
${JSON.stringify(state.practiceProfile, null, 2)}

Here are keyword opportunities (${allKeywords.length} total):
${JSON.stringify(allKeywords.slice(0, 100), null, 2)}

Tasks:
1. Rank the top 30 keywords by priority. Consider: search volume, difficulty (prefer <40), 
   relevance to this practice's services, and local intent.
2. For the top 10, suggest a content topic (blog post title + brief angle).
3. Return JSON: { prioritizedKeywords: [...], contentTopics: [...] }`
  }]);
  
  const parsed = JSON.parse(extractJSON(response.content));
  return {
    prioritizedKeywords: parsed.prioritizedKeywords,
    contentTopics: parsed.contentTopics,
  };
}

async function saveResults(state: typeof ScholarState.State) {
  // Upsert keywords to tracking table
  for (const kw of state.prioritizedKeywords) {
    await supabaseAdmin.from('keywords').upsert({
      org_id: state.orgId,
      client_id: state.clientId,
      keyword: kw.keyword,
      search_volume: kw.volume,
      difficulty: kw.difficulty,
      keyword_type: 'target',
      source: kw.source || 'scholar',
      current_position: kw.currentPosition || null,
    }, { onConflict: 'client_id,keyword' });
  }
  
  // Update agent_runs
  await supabaseAdmin.from('agent_runs').update({
    status: 'completed',
    result: { keywordsTracked: state.prioritizedKeywords.length, topicsGenerated: state.contentTopics.length },
    completed_at: new Date().toISOString(),
  }).eq('id', state.runId);
  
  return {};
}

// Build graph
export function createScholarGraph() {
  const graph = new StateGraph(ScholarState)
    .addNode('fetch_gsc', fetchGSCData)
    .addNode('research', researchKeywords)
    .addNode('competitors', analyzeCompetitors)
    .addNode('gap_analysis', runGapAnalysis)
    .addNode('prioritize', prioritizeAndRecommend)
    .addNode('save', saveResults)
    .addEdge('__start__', 'fetch_gsc')
    .addEdge('fetch_gsc', 'research')
    .addEdge('research', 'competitors')
    .addEdge('competitors', 'gap_analysis')
    .addEdge('gap_analysis', 'prioritize')
    .addEdge('prioritize', 'save')
    .addEdge('save', END);
  
  return graph.compile({ checkpointer: supabaseCheckpointer });
}
```

**Week 5 Exit Criteria:** Scholar agent runs end-to-end for a test client. Keywords stored in database. Content topics generated. Keyword positions shown in manager dashboard.

---

## Week 6: Ghostwriter Agent (LangGraph)

### 6.1 Ghostwriter Graph

```typescript
// packages/agents/ghostwriter/graph.ts
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatAnthropic } from '@langchain/anthropic';
import { complianceEngine } from '../../compliance/engine';

const GhostwriterState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  practiceProfile: Annotation<Record<string, any>>,
  topic: Annotation<{ keyword: string; title: string; angle: string }>,
  brief: Annotation<any>,
  content: Annotation<{ html: string; markdown: string; wordCount: number }>,
  seoScore: Annotation<number>,
  complianceResult: Annotation<{ status: string; details: any[] }>,
  contentPieceId: Annotation<string | null>,
  queueItemId: Annotation<string | null>,
  rewriteAttempts: Annotation<number>,
});

async function generateBrief(state: typeof GhostwriterState.State) {
  const claude = new ChatAnthropic({ model: 'claude-sonnet-4-5-20250929' });
  
  // Fetch top-ranking content for this keyword
  const competitors = await fetchTopRanking(state.topic.keyword, 3);
  
  const response = await claude.invoke([{
    role: 'user',
    content: `Create a detailed content brief for a dental practice blog post.

Target keyword: "${state.topic.keyword}"
Suggested title: "${state.topic.title}"
Angle: "${state.topic.angle}"

Practice info:
- Name: ${state.practiceProfile.name}
- Location: ${state.practiceProfile.locations?.[0]?.address}
- Specialties: ${state.practiceProfile.services?.join(', ')}
- Doctors: ${state.practiceProfile.doctors?.map(d => `${d.name}, ${d.title}`).join('; ')}

Top 3 competing articles:
${competitors.map((c, i) => `${i+1}. "${c.title}" (${c.wordCount} words) - ${c.url}`).join('\n')}

Return JSON: {
  suggestedTitle: "...",
  h2Sections: ["...", "..."],
  targetWordCount: number,
  internalLinks: [{ page: "...", anchorText: "..." }],
  uniqueAngles: ["..."],
  practiceSpecificHooks: ["..."]
}`
  }]);
  
  return { brief: JSON.parse(extractJSON(response.content)) };
}

async function writeContent(state: typeof GhostwriterState.State) {
  const claude = new ChatAnthropic({
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 4096,
  });
  
  const { practiceProfile, brief, topic } = state;
  
  const response = await claude.invoke([{
    role: 'system',
    content: `You are a dental content writer for ${practiceProfile.name}. 
Write in a warm, professional, approachable tone.

CRITICAL RULES:
- Never provide specific medical advice or diagnosis
- Never guarantee treatment outcomes
- Always suggest "consult your dentist" for personalized advice
- Use the practice's doctor names naturally when relevant
- Include the target keyword "${topic.keyword}" naturally (2-3% density)
- Reference the practice location: ${practiceProfile.locations?.[0]?.address}
- Write for a general audience (8th grade reading level)
- Include an FAQ section with 3-4 questions using conversational phrasing`
  }, {
    role: 'user',
    content: `Write a comprehensive blog post based on this brief:
${JSON.stringify(brief, null, 2)}

Target: ${brief.targetWordCount} words.
Include HTML formatting (h2, h3, p, ul, ol, strong, em).
Include a meta title (max 70 chars) and meta description (max 160 chars).

Return JSON: {
  html: "full HTML content",
  markdown: "markdown version",
  metaTitle: "...",
  metaDescription: "...",
  wordCount: number
}`
  }]);
  
  const parsed = JSON.parse(extractJSON(response.content));
  return {
    content: {
      html: parsed.html,
      markdown: parsed.markdown,
      wordCount: parsed.wordCount,
    },
    metaTitle: parsed.metaTitle,
    metaDescription: parsed.metaDescription,
  };
}

async function checkCompliance(state: typeof GhostwriterState.State) {
  const result = await complianceEngine.check(state.content.html, 'dental');
  return { complianceResult: result };
}

async function handleCompliance(state: typeof GhostwriterState.State) {
  const { complianceResult, content, rewriteAttempts } = state;
  
  if (complianceResult.status === 'pass') {
    return {}; // Continue to queue
  }
  
  if (complianceResult.status === 'block' && rewriteAttempts < 2) {
    // Auto-rewrite blocked sections
    const claude = new ChatAnthropic({ model: 'claude-sonnet-4-5-20250929' });
    const flagged = complianceResult.details.filter(d => d.severity === 'block');
    
    const response = await claude.invoke([{
      role: 'user',
      content: `Rewrite the following content sections to remove compliance violations.
Keep the same meaning but make it compliant with dental content rules.

Flagged sections:
${flagged.map(f => `- "${f.phrase}" — Issue: ${f.reason}`).join('\n')}

Full content:
${content.html}

Return the FULL corrected HTML content.`
    }]);
    
    return {
      content: { ...content, html: response.content as string },
      rewriteAttempts: rewriteAttempts + 1,
    };
  }
  
  if (complianceResult.status === 'warn') {
    // Auto-inject disclaimers for warnings
    let html = content.html;
    for (const warning of complianceResult.details.filter(d => d.severity === 'warn')) {
      if (warning.disclaimer) {
        html = html.replace(
          '</article>',
          `<p class="disclaimer"><em>${warning.disclaimer}</em></p></article>`
        );
      }
    }
    return { content: { ...content, html } };
  }
  
  return {}; // If max retries hit on block, still queue it — manager will see compliance badge
}

async function queueForReview(state: typeof GhostwriterState.State) {
  // Create content piece
  const { data: piece } = await supabaseAdmin.from('content_pieces').insert({
    org_id: state.orgId,
    client_id: state.clientId,
    title: state.brief.suggestedTitle,
    body_html: state.content.html,
    body_markdown: state.content.markdown,
    content_type: 'blog_post',
    status: 'in_review',
    target_keyword: state.topic.keyword,
    seo_score: state.seoScore,
    word_count: state.content.wordCount,
    compliance_status: state.complianceResult.status,
    compliance_details: state.complianceResult.details,
    meta_title: state.metaTitle,
    meta_description: state.metaDescription,
  }).select('id').single();
  
  // Create queue item
  const { data: action } = await supabaseAdmin.from('agent_actions').insert({
    org_id: state.orgId,
    client_id: state.clientId,
    agent: 'ghostwriter',
    action_type: 'content_new',
    autonomy_tier: 2,
    status: 'pending',
    severity: state.complianceResult.status === 'block' ? 'critical' : 'info',
    description: `New blog post: "${state.brief.suggestedTitle}" targeting "${state.topic.keyword}"`,
    proposed_data: { content_piece_id: piece.id, keyword: state.topic.keyword },
    content_piece_id: piece.id,
  }).select('id').single();
  
  return { contentPieceId: piece.id, queueItemId: action.id };
}

// Graph with compliance loop
export function createGhostwriterGraph() {
  const graph = new StateGraph(GhostwriterState)
    .addNode('brief', generateBrief)
    .addNode('write', writeContent)
    .addNode('seo_score', scoreSEO)
    .addNode('compliance', checkCompliance)
    .addNode('handle_compliance', handleCompliance)
    .addNode('queue', queueForReview)
    .addEdge('__start__', 'brief')
    .addEdge('brief', 'write')
    .addEdge('write', 'seo_score')
    .addEdge('seo_score', 'compliance')
    .addEdge('compliance', 'handle_compliance')
    .addConditionalEdges('handle_compliance', (state) => {
      // If blocked and rewrite needed, loop back to compliance check
      if (state.complianceResult.status === 'block' && state.rewriteAttempts < 2) {
        return 'compliance';
      }
      return 'queue';
    })
    .addEdge('queue', END);
  
  return graph.compile({ checkpointer: supabaseCheckpointer });
}
```

### 6.2 Compliance Engine

```typescript
// packages/compliance/engine.ts
import { ChatAnthropic } from '@langchain/anthropic';

const DENTAL_RULES = [
  { id: 'medical_advice', pattern: /\b(diagnos|prescrib|you (should|must|need to) take|will cure|guaranteed to)\b/i, severity: 'block', reason: 'Contains medical advice or diagnosis' },
  { id: 'guaranteed_outcome', pattern: /\b(guaranteed?|100%|always works|permanent(ly)? (fix|solve|cure))\b/i, severity: 'block', reason: 'Guarantees treatment outcome' },
  { id: 'drug_dosage', pattern: /\b(\d+\s*mg|\d+\s*ml|take \d+ (pills?|tablets?|capsules?))\b/i, severity: 'block', reason: 'Contains specific drug dosage' },
  { id: 'price_claim', pattern: /\$([\d,]+)(?!\*)/i, severity: 'warn', reason: 'Price claim without disclaimer', disclaimer: '*Pricing may vary. Contact our office for current pricing.' },
  { id: 'health_info', pattern: /\b(treatment|procedure|surgery|extraction|implant|root canal)\b/i, severity: 'warn', reason: 'General health information', disclaimer: 'Consult your dentist for personalized advice about your specific situation.' },
];

export const complianceEngine = {
  async check(html: string, vertical: string): Promise<ComplianceResult> {
    const text = stripHTML(html);
    const details: ComplianceDetail[] = [];
    
    // Rule-based checks first (fast)
    for (const rule of DENTAL_RULES) {
      const matches = text.match(new RegExp(rule.pattern, 'gi'));
      if (matches) {
        for (const match of matches) {
          details.push({
            rule: rule.id,
            severity: rule.severity,
            phrase: match,
            reason: rule.reason,
            disclaimer: rule.disclaimer,
          });
        }
      }
    }
    
    // LLM-based check for nuanced issues (catch what regex misses)
    const haiku = new ChatAnthropic({ model: 'claude-haiku-4-5-20251001' });
    const llmCheck = await haiku.invoke([{
      role: 'user',
      content: `Review this dental practice content for compliance issues.

Flag any content that:
1. Makes specific medical diagnoses
2. Recommends specific treatments as if prescribing
3. Guarantees outcomes
4. Contains testimonials with health claims
5. Makes comparative claims without evidence ("best dentist in town")

Content:
${text.slice(0, 3000)}

Return JSON array of issues: [{ severity: "block"|"warn", phrase: "...", reason: "..." }]
Return empty array [] if no issues found.`
    }]);
    
    const llmIssues = JSON.parse(extractJSON(llmCheck.content));
    details.push(...llmIssues);
    
    const hasBlock = details.some(d => d.severity === 'block');
    const hasWarn = details.some(d => d.severity === 'warn');
    
    return {
      status: hasBlock ? 'block' : hasWarn ? 'warn' : 'pass',
      details,
    };
  }
};
```

**Week 6 Exit Criteria:** Ghostwriter generates a real blog post for a test client. Compliance gates catch test violations. Content appears in Manager approval queue with compliance badge. Content editor displays the piece.

---

## Week 7: Local SEO Module

### 7.1 GBP Integration

```typescript
// packages/local-seo/gbp-service.ts
import { google } from 'googleapis';

export class GBPService {
  private auth: any;
  
  constructor(tokens: DecryptedTokens) {
    this.auth = new google.auth.OAuth2();
    this.auth.setCredentials(tokens);
  }
  
  async createPost(locationId: string, post: GBPPostInput) {
    const mybusiness = google.mybusiness({ version: 'v4', auth: this.auth });
    
    const result = await mybusiness.accounts.locations.localPosts.create({
      parent: locationId,
      requestBody: {
        languageCode: 'en',
        summary: post.body,
        topicType: post.type === 'offer' ? 'OFFER' : 'STANDARD',
        callToAction: post.ctaType ? {
          actionType: post.ctaType.toUpperCase(),
          url: post.ctaUrl,
        } : undefined,
      },
    });
    
    return result.data;
  }
  
  async getReviews(locationId: string) {
    const mybusiness = google.mybusiness({ version: 'v4', auth: this.auth });
    const result = await mybusiness.accounts.locations.reviews.list({ parent: locationId });
    return result.data.reviews || [];
  }
  
  async generateReviewResponse(review: any, practiceProfile: any) {
    const claude = new ChatAnthropic({ model: 'claude-sonnet-4-5-20250929' });
    
    const response = await claude.invoke([{
      role: 'system',
      content: `You are responding to a Google review for ${practiceProfile.name}. 
Be warm, professional, and personal. Thank the reviewer by name. 
If positive: express genuine gratitude, mention you'll share with the team.
If negative: express concern, invite them to contact the office directly.
Never mention specific treatments or health information.
Keep under 150 words.`
    }, {
      role: 'user',
      content: `Review by ${review.reviewer.displayName} (${review.starRating} stars):
"${review.comment}"

Write a response.`
    }]);
    
    return response.content;
  }
}
```

**Week 7 Exit Criteria:** GBP posts can be created and scheduled. Review response templates generated. Manager can schedule GBP posts from client overview.

---

## Week 8: Integration + Dashboard Wiring

### 8.1 Conductor Pipeline

```typescript
// packages/agents/conductor/graph.ts
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { createScholarGraph } from '../scholar/graph';
import { createGhostwriterGraph } from '../ghostwriter/graph';

const ConductorState = Annotation.Root({
  clientId: Annotation<string>,
  orgId: Annotation<string>,
  runId: Annotation<string>,
  stage: Annotation<string>,
  scholarResult: Annotation<any>,
  ghostwriterResults: Annotation<any[]>,
  error: Annotation<string | null>,
});

async function checkHealth(state: typeof ConductorState.State) {
  const client = await supabaseAdmin.from('clients')
    .select('account_health, google_tokens, cms_credentials')
    .eq('id', state.clientId).single();
  
  if (client.data.account_health !== 'active') {
    return { error: 'Client account health is not active. Skipping pipeline.', stage: 'failed' };
  }
  
  // Verify Google tokens still work
  try {
    const tokens = decryptTokens(client.data.google_tokens);
    await refreshTokenIfNeeded(tokens, state.clientId);
  } catch {
    await supabaseAdmin.from('clients').update({ account_health: 'disconnected' }).eq('id', state.clientId);
    return { error: 'Google tokens expired. Marked client as disconnected.', stage: 'failed' };
  }
  
  return { stage: 'scholar' };
}

async function runScholar(state: typeof ConductorState.State) {
  const scholar = createScholarGraph();
  const client = await supabaseAdmin.from('clients')
    .select('practice_profile, org_id').eq('id', state.clientId).single();
  
  const result = await scholar.invoke({
    clientId: state.clientId,
    orgId: state.orgId,
    runId: `scholar-${state.runId}`,
    practiceProfile: client.data.practice_profile,
  });
  
  return { scholarResult: result, stage: 'ghostwriter' };
}

async function runGhostwriter(state: typeof ConductorState.State) {
  const ghostwriter = createGhostwriterGraph();
  const client = await supabaseAdmin.from('clients')
    .select('practice_profile').eq('id', state.clientId).single();
  
  // Generate content for top 2 topics from Scholar
  const topics = state.scholarResult.contentTopics.slice(0, 2);
  const results = [];
  
  for (const topic of topics) {
    const result = await ghostwriter.invoke({
      clientId: state.clientId,
      orgId: state.orgId,
      runId: `gw-${state.runId}-${topic.keyword}`,
      practiceProfile: client.data.practice_profile,
      topic,
      rewriteAttempts: 0,
    });
    results.push(result);
  }
  
  return { ghostwriterResults: results, stage: 'complete' };
}

export function createConductorGraph() {
  const graph = new StateGraph(ConductorState)
    .addNode('check_health', checkHealth)
    .addNode('scholar', runScholar)
    .addNode('ghostwriter', runGhostwriter)
    .addEdge('__start__', 'check_health')
    .addConditionalEdges('check_health', (state) => 
      state.error ? END : 'scholar'
    )
    .addEdge('scholar', 'ghostwriter')
    .addEdge('ghostwriter', END);
  
  return graph.compile({ checkpointer: supabaseCheckpointer });
}

// Weekly cron trigger
// Use Vercel Cron or Railway cron job
export async function weeklyPipeline() {
  const clients = await supabaseAdmin.from('clients')
    .select('id, org_id')
    .eq('account_health', 'active');
  
  for (const client of clients.data || []) {
    const conductor = createConductorGraph();
    const runId = `conductor-${Date.now()}-${client.id}`;
    
    await supabaseAdmin.from('agent_runs').insert({
      org_id: client.org_id,
      client_id: client.id,
      agent: 'conductor',
      status: 'running',
      trigger: 'scheduled',
    });
    
    // Run async — don't block the cron
    conductor.invoke({
      clientId: client.id,
      orgId: client.org_id,
      runId,
      stage: 'init',
    }).catch(async (err) => {
      await supabaseAdmin.from('agent_runs').update({
        status: 'failed',
        error: err.message,
      }).eq('graph_id', runId);
    });
  }
}
```

### 8.2 Dashboard API Wiring

```typescript
// app/api/practice/dashboard/route.ts
import { auth } from '@clerk/nextjs/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET() {
  const { orgId } = await auth();
  const supabase = await supabaseServer();
  
  // Get client for this org
  const { data: client } = await supabase
    .from('clients').select('*').eq('org_id', orgId).single();
  
  // KPI data
  const [keywords, content, recentActions] = await Promise.all([
    supabase.from('keywords').select('current_position, previous_position')
      .eq('client_id', client.id).eq('keyword_type', 'target'),
    supabase.from('content_pieces').select('id, status, published_at')
      .eq('client_id', client.id),
    supabase.from('agent_actions').select('*')
      .eq('client_id', client.id).eq('status', 'deployed')
      .order('deployed_at', { ascending: false }).limit(10),
  ]);
  
  const improving = keywords.data?.filter(k => 
    k.current_position && k.previous_position && k.current_position < k.previous_position
  ).length || 0;
  
  const publishedThisMonth = content.data?.filter(c => 
    c.status === 'published' && 
    new Date(c.published_at) > startOfMonth()
  ).length || 0;
  
  // Translate recent actions to "wins" in plain English
  const wins = recentActions.data?.map(action => toPlainEnglishWin(action)) || [];
  
  return Response.json({
    kpis: {
      organicTraffic: { value: 0, trend: 0 }, // Populated by Analyst
      rankingsImproving: { value: improving },
      contentPublished: { value: publishedThisMonth },
      healthScore: { value: client.health_score },
    },
    wins,
  });
}
```

**Week 8 Exit Criteria:** Full pipeline runs: Conductor → Scholar → Ghostwriter → queue. Dashboard shows real keyword data and content. Manager can approve content in queue. Practice dashboard shows wins.

---

## Weeks 9–10: QA + Launch

### 9.1 End-to-End Test Checklist

- [ ] **Self-service funnel:** Visit zintas.ai → run audit → get score → sign up → onboard → Google OAuth → CMS detected → client appears in Manager portfolio
- [ ] **Manager funnel:** Manager creates client manually → practice appears → invite sent
- [ ] **Agent pipeline:** Conductor triggers → Scholar researches keywords → Ghostwriter creates content → compliance gate runs → content appears in queue
- [ ] **Approval flow:** Manager sees queue item → expands detail → sees compliance badge → approves → content deploys to WordPress
- [ ] **Practice dashboard:** Practice owner logs in → sees KPI cards → sees published content → sees recent wins
- [ ] **Local SEO:** Manager creates GBP post → schedules → publishes → appears in client timeline
- [ ] **Rollback:** Approved content → deployed to WordPress → manager clicks rollback → post set to draft
- [ ] **Error handling:** Google token expires → client marked disconnected → manager alerted → reconnect flow works
- [ ] **Security:** Practice owner cannot access /dashboard. Manager cannot see other org's data. Rate limiting works on audit tool.

### 9.2 Deploy Production

```bash
# Vercel deployment
vercel --prod

# Set environment variables in Vercel dashboard
# Set Supabase to production project
# Enable Clerk production instance
# Point zintas.ai domain to Vercel

# Railway for agent worker
railway deploy
```

**Week 10 Exit Criteria:** 3–5 dental practices onboarded and live. Baselines captured. First Scholar run completed. Marketing site live at zintas.ai. Audit tool capturing leads. You're in operations mode.

---

## Bug Pitfalls & Gotchas

🐛 **LangGraph checkpointer serialization:** State objects with Date types fail serialization. Convert all dates to ISO strings before storing in state.

🐛 **Clerk orgRole is null on first request after org creation.** Add a 1-second delay or refetch after creating the org in onboarding.

🐛 **Supabase RLS blocks agent writes.** Agent processes run server-side without a user JWT. Use `supabaseAdmin` (service role) for all agent database operations, never `supabaseServer`.

🐛 **SE Ranking API rate limits during bulk research.** Add 500ms delay between keyword research calls. Batch requests where possible.

🐛 **Google OAuth tokens expire after 1 hour.** Always call `refreshTokenIfNeeded()` before any Google API call. Store both access_token and refresh_token.

🐛 **WordPress REST API returns 401 with application passwords on some hosts.** Check for Basic Auth support: some cheap shared hosts disable it. Fallback: use WP REST API OAuth 1.0 plugin.

🐛 **Compliance regex matches inside HTML tags.** Always `stripHTML()` before running compliance checks, then apply fixes to the original HTML.

🐛 **Free audit tool fetch() fails on sites with aggressive bot protection.** Set a reasonable User-Agent, handle 403/503 gracefully, return partial results with a "we couldn't fully scan" message.

🐛 **Bolt components use different import paths than your monorepo.** After importing screens, batch find-and-replace: `@/components/ui/` to match your actual shadcn/ui install path.
