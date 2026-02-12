# Zintas AI Pilot — Claude Code Development Guide

## How to Use This Document

This document contains **42 tasks** that build the entire Zintas AI pilot, excluding the 11 Bolt-scaffolded screens. Each task is designed to be handed to **Claude Code** (Anthropic's CLI agent) as a single unit of work.

### Workflow

```
1. Open Claude Code in your terminal: claude
2. Copy the task prompt (everything inside the --- markers)
3. Paste it into Claude Code
4. Review the output
5. Run the acceptance criteria tests
6. If all pass → commit and move to next task
7. If any fail → paste the failing test output back into Claude Code and ask it to fix
```

### Rules for Working with Claude Code

1. **One task at a time.** Don't combine tasks. Each task is scoped to be completable in a single Claude Code session.
2. **Always provide context.** At the start of each session, tell Claude Code: "Read the project structure first" or point it to relevant existing files.
3. **Test before committing.** Every task has acceptance criteria. Run them before moving on.
4. **Don't skip tasks.** Tasks are ordered by dependency. Task 12 depends on Task 11.
5. **Commit after each task.** `git commit -m "TASK-XX: [description]"` — this gives you rollback points.
6. **If Claude Code gets confused**, start a new session and re-paste the task with additional context about what exists.

### Task Naming Convention

```
TASK-01 through TASK-42
Phase 0: Foundation (TASK-01 to TASK-08)
Phase 1: Marketing + Audit (TASK-09 to TASK-13)
Phase 2: Auth + Onboarding (TASK-14 to TASK-19)
Phase 3: Scholar Agent (TASK-20 to TASK-24)
Phase 4: Ghostwriter Agent (TASK-25 to TASK-30)
Phase 5: Local SEO (TASK-31 to TASK-33)
Phase 6: Integration + Wiring (TASK-34 to TASK-39)
Phase 7: QA + Polish (TASK-40 to TASK-42)
```

### Development Guidelines (Apply to ALL Tasks)

```
IMPORTANT: Include these guidelines at the top of every Claude Code session:

"You are building the Zintas AI pilot — an AI-powered dental SEO platform.
Follow these rules for ALL code you write:

ARCHITECTURE:
- Next.js 14 App Router with TypeScript (strict mode)
- All components are React Server Components by default. Only add 'use client' when needed (state, effects, event handlers)
- Use route groups: (public), (practice), (manager), (onboarding)
- Shared code goes in packages/ directory
- All database queries go through packages/db/ — never import Supabase directly in route handlers

CODE STYLE:
- TypeScript strict mode. No 'any' types. Define interfaces for all data shapes.
- Use Zod for ALL API input validation. Never trust user input.
- Use named exports, not default exports (except page.tsx files)
- Error handling: try/catch with specific error types. Never swallow errors silently.
- Async/await everywhere. No .then() chains.
- Use early returns to reduce nesting.

SECURITY:
- Always check auth via Clerk's auth() in API routes
- Always check orgRole before processing manager vs practice requests
- Use supabaseAdmin (service role) for agent/server operations
- Use supabaseServer (with RLS) for user-facing operations
- Never log credentials, tokens, or PII
- Validate all inputs with Zod before processing
- Rate limit public endpoints

TESTING:
- Write tests inline when asked or when the acceptance criteria require it
- Use Vitest for unit tests
- Test files go next to source: foo.ts → foo.test.ts

FILE NAMING:
- kebab-case for files: google-oauth.ts, not googleOAuth.ts
- PascalCase for React components: AuditResults.tsx
- camelCase for functions and variables
- UPPER_SNAKE_CASE for environment variables and constants

COMMITS:
- After completing a task, suggest a commit message"
```

---

## PHASE 0: Foundation (Week 1)

---

### TASK-01: Project Initialization

**Hand to Claude Code:**

```
Create a new Next.js 14 project for the Zintas AI dental SEO platform.

Requirements:
- Next.js 14 with App Router, TypeScript strict mode, Tailwind CSS, ESLint
- Project name: zintas-pilot
- Create this directory structure:

  app/
    (public)/         — marketing site (no auth required)
    (practice)/       — practice owner portal (practice_owner role)
    (manager)/        — manager command center (manager role)
    (onboarding)/     — onboarding wizard (authenticated, no org yet)
    api/              — all API routes
  packages/
    db/               — Supabase client, types, queries
    agents/           — LangGraph agent code
      conductor/
      scholar/
      ghostwriter/
      analyst/
    compliance/       — compliance gate engine
    plain-english/    — technical → plain English translator
    local-seo/        — GBP integration
    audit-engine/     — free audit tool backend
  supabase/
    migrations/       — SQL migration files
  infrastructure/     — Docker, CI/CD configs

Install these dependencies:
- @clerk/nextjs @supabase/supabase-js @supabase/ssr
- @langchain/core @langchain/anthropic @langchain/langgraph
- @upstash/redis @upstash/ratelimit
- zod react-hook-form @hookform/resolvers
- recharts date-fns
- resend @react-email/components
- stripe (install but not used until post-pilot)

Install shadcn/ui and add these components:
button, card, input, label, select, table, tabs, badge, dialog,
dropdown-menu, sheet, tooltip, progress, separator, avatar,
accordion, checkbox, switch, textarea, popover, command, calendar

Create a .env.example file with all required environment variables
(see the env list below). Do NOT include actual values.

Environment variables needed:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in,
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up,
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY,
ANTHROPIC_API_KEY, SE_RANKING_API_KEY,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
RESEND_API_KEY, RECAPTCHA_SECRET_KEY,
ENCRYPTION_KEY, AGENT_API_KEY,
NEXT_PUBLIC_APP_URL

Create a tsconfig.json with strict mode and path aliases:
  @/* → app/*
  @packages/* → packages/*
  @/components/* → app/components/*

Create placeholder page.tsx files in each route group with a simple
"Portal Name — Coming Soon" message so the app compiles and routes work.
```

**Acceptance Criteria:**
- [ ] `npm run dev` starts without errors
- [ ] Visiting `/` shows "Public — Coming Soon"
- [ ] Visiting `/practice/dashboard` shows "Practice — Coming Soon"
- [ ] Visiting `/dashboard` shows "Manager — Coming Soon"
- [ ] Visiting `/onboarding/start` shows "Onboarding — Coming Soon"
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `.env.example` contains all 16 environment variables
- [ ] All directories exist in the structure above

---

### TASK-02: Supabase Schema + Types

**Hand to Claude Code:**

```
Create the Supabase database schema for the Zintas AI pilot.

Create file: supabase/migrations/001_pilot_schema.sql

Tables needed (with full column definitions):

1. clients — dental practice records
   id (UUID PK), org_id (TEXT NOT NULL), name (TEXT NOT NULL),
   domain (TEXT NOT NULL), management_mode (ENUM: managed|self_service DEFAULT managed),
   vertical (TEXT DEFAULT 'dental'), health_score (INTEGER DEFAULT 0),
   practice_profile (JSONB DEFAULT '{}'), google_tokens (JSONB DEFAULT '{}'),
   cms_type (TEXT), cms_credentials (JSONB DEFAULT '{}'),
   account_health (ENUM: active|disconnected|error DEFAULT active),
   competitors (JSONB DEFAULT '[]'), onboarding_step (INTEGER),
   onboarding_completed_at (TIMESTAMPTZ), created_at, updated_at

2. content_pieces — AI-generated content
   id (UUID PK), org_id (TEXT NOT NULL), client_id (UUID FK→clients),
   title (TEXT NOT NULL), body_html (TEXT), body_markdown (TEXT),
   content_type (ENUM: blog_post|service_page|faq|gbp_post),
   status (ENUM: draft|in_review|approved|published|rejected DEFAULT draft),
   target_keyword (TEXT), related_keywords (JSONB DEFAULT '[]'),
   seo_score (INTEGER DEFAULT 0), word_count (INTEGER DEFAULT 0),
   compliance_status (ENUM: pass|warn|block DEFAULT pass),
   compliance_details (JSONB DEFAULT '[]'),
   meta_title (TEXT), meta_description (TEXT),
   published_url (TEXT), published_at (TIMESTAMPTZ), created_at, updated_at

3. keywords — keyword tracking from SE Ranking
   id (UUID PK), org_id (TEXT NOT NULL), client_id (UUID FK→clients),
   keyword (TEXT NOT NULL), current_position (INTEGER),
   previous_position (INTEGER), best_position (INTEGER),
   search_volume (INTEGER DEFAULT 0), difficulty (INTEGER DEFAULT 0),
   keyword_type (TEXT DEFAULT 'tracked'), source (TEXT DEFAULT 'manual'),
   serp_features (JSONB DEFAULT '[]'), last_checked_at (TIMESTAMPTZ),
   created_at

4. agent_actions — approval queue items
   id (UUID PK), org_id (TEXT NOT NULL), client_id (UUID FK→clients),
   agent (ENUM: conductor|scholar|ghostwriter|analyst),
   action_type (TEXT NOT NULL), autonomy_tier (INTEGER DEFAULT 2),
   status (ENUM: pending|approved|rejected|deployed|rolled_back DEFAULT pending),
   severity (ENUM: critical|warning|info DEFAULT info),
   description (TEXT NOT NULL), proposed_data (JSONB DEFAULT '{}'),
   rollback_data (JSONB DEFAULT '{}'),
   content_piece_id (UUID FK→content_pieces NULLABLE),
   approved_by (TEXT), approved_at (TIMESTAMPTZ),
   deployed_at (TIMESTAMPTZ), created_at

5. leads — free audit tool captures (NO RLS)
   id (UUID PK), domain (TEXT NOT NULL), email (TEXT),
   audit_score (INTEGER), audit_results (JSONB DEFAULT '{}'),
   converted (BOOLEAN DEFAULT FALSE), converted_at (TIMESTAMPTZ),
   source (TEXT), ip_hash (TEXT), created_at

6. gbp_posts — Google Business Profile posts
   id (UUID PK), org_id (TEXT NOT NULL), client_id (UUID FK→clients),
   post_type (TEXT DEFAULT 'update'), title (TEXT), body (TEXT NOT NULL),
   image_url (TEXT), cta_type (TEXT), cta_url (TEXT),
   status (ENUM: draft|scheduled|published DEFAULT draft),
   scheduled_at (TIMESTAMPTZ), published_at (TIMESTAMPTZ),
   gbp_post_id (TEXT), created_at

7. agent_runs — LangGraph execution tracking
   id (UUID PK), org_id (TEXT NOT NULL), client_id (UUID FK→clients),
   agent (ENUM: conductor|scholar|ghostwriter|analyst),
   graph_id (TEXT), status (ENUM: running|paused|completed|failed DEFAULT running),
   trigger (TEXT DEFAULT 'manual'), config (JSONB DEFAULT '{}'),
   result (JSONB DEFAULT '{}'), error (TEXT),
   started_at (TIMESTAMPTZ DEFAULT NOW()), completed_at (TIMESTAMPTZ),
   checkpoint_data (JSONB DEFAULT '{}')

For ALL tables except leads:
- Enable Row Level Security
- Create policy: org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')

Create indexes for performance:
- agent_actions(status, org_id)
- agent_actions(client_id, status)
- content_pieces(client_id, status)
- keywords(client_id, keyword_type)
- keywords(client_id, current_position)
- leads(email) WHERE email IS NOT NULL
- leads(domain)
- gbp_posts(scheduled_at) WHERE status = 'scheduled'

Create an updated_at trigger for clients and content_pieces tables.

Also create file: packages/db/types.ts
Generate TypeScript types matching every table. Use strict types (no any).
Export all types.

Also create file: packages/db/client.ts
Export two Supabase client factories:
- supabaseServer() — uses cookies from Clerk for RLS (user-facing requests)
- supabaseAdmin — uses service role key (agent/server operations, bypasses RLS)
```

**Acceptance Criteria:**
- [ ] SQL file is valid — no syntax errors when run against Supabase
- [ ] All 7 tables defined with correct columns and types
- [ ] RLS enabled on 6 tables (not leads)
- [ ] RLS policies reference JWT org_id claim
- [ ] 8 indexes created
- [ ] `packages/db/types.ts` exports TypeScript interfaces for all 7 tables
- [ ] `packages/db/client.ts` exports `supabaseServer` and `supabaseAdmin`
- [ ] `npx tsc --noEmit` passes

---

### TASK-03: Clerk Auth Integration

**Hand to Claude Code:**

```
Integrate Clerk authentication into the Zintas pilot.

1. Create app/layout.tsx (root layout):
   - Wrap with ClerkProvider
   - Include <html>, <body>, Tailwind globals
   - Add metadata: title "Zintas AI", description "AI-powered dental marketing"

2. Create app/(public)/layout.tsx:
   - No auth wrapper — public pages
   - Include a simple marketing header with Zintas logo, nav links (Home, Pricing, Free Audit), and "Sign In" / "Get Started" buttons
   - Include a footer with copyright

3. Create app/(practice)/layout.tsx:
   - Imports auth() from @clerk/nextjs/server
   - Checks orgRole. If 'org:manager', redirect to /dashboard
   - If no orgId, redirect to /onboarding/start
   - Render a practice shell: sidebar with nav (Dashboard, Content, Reports, Settings), top bar with practice name + user avatar

4. Create app/(manager)/layout.tsx:
   - Imports auth() from @clerk/nextjs/server
   - Checks orgRole. If 'org:practice_owner', redirect to /practice/dashboard
   - If no orgId, redirect to /onboarding/start
   - Render a manager shell: dark sidebar (Portfolio, Queue with badge, Onboard Client, Leads, Settings), content area

5. Create app/(onboarding)/layout.tsx:
   - Requires authentication (redirect to sign-in if not authed)
   - If user already has an org with onboarding complete, redirect to appropriate portal based on role
   - Minimal layout: Zintas logo centered, progress bar placeholder, white background

6. Create middleware.ts:
   - Use clerkMiddleware and createRouteMatcher
   - Public routes: /, /audit/*, /pricing, /api/audit/free/*
   - Route protection logic:
     No auth → redirect to sign-in (except public routes)
     Auth + no org → redirect to /onboarding/start (except onboarding routes)
     Auth + org + manager role + hitting /practice/* → redirect to /dashboard
     Auth + org + practice_owner role + hitting /dashboard/* → redirect to /practice/dashboard

7. Create app/sign-in/[[...sign-in]]/page.tsx and
   app/sign-up/[[...sign-up]]/page.tsx using Clerk's pre-built components.

Use shadcn/ui components for navigation, buttons, avatars.
Use Lucide icons for sidebar nav items.
```

**Acceptance Criteria:**
- [ ] Unauthenticated user can visit `/`, `/audit`, `/pricing`
- [ ] Unauthenticated user visiting `/practice/dashboard` is redirected to sign-in
- [ ] Unauthenticated user visiting `/dashboard` is redirected to sign-in
- [ ] Authenticated user without an org is redirected to `/onboarding/start`
- [ ] Practice shell renders with sidebar nav (Dashboard, Content, Reports, Settings)
- [ ] Manager shell renders with dark sidebar nav (Portfolio, Queue, Leads, Settings)
- [ ] `npx tsc --noEmit` passes
- [ ] No hydration errors in browser console

---

### TASK-04: Database Query Layer

**Hand to Claude Code:**

```
Create the database query layer in packages/db/queries/.

Create these query modules, each exporting async functions that
use supabaseServer or supabaseAdmin:

1. packages/db/queries/clients.ts:
   - getClientByOrgId(orgId: string) → Client | null
   - getClientById(clientId: string) → Client | null
   - getAllClients() → Client[] (manager use, uses admin client)
   - createClient(data: CreateClientInput) → Client
   - updateClient(clientId: string, data: Partial<Client>) → Client
   - updateClientHealth(clientId: string, score: number) → void

2. packages/db/queries/content.ts:
   - getContentByClient(clientId: string, filters?: { status?, type? }) → ContentPiece[]
   - getContentById(contentId: string) → ContentPiece | null
   - createContent(data: CreateContentInput) → ContentPiece
   - updateContent(contentId: string, data: Partial<ContentPiece>) → ContentPiece
   - publishContent(contentId: string, publishedUrl: string) → ContentPiece

3. packages/db/queries/keywords.ts:
   - getKeywordsByClient(clientId: string, type?: string) → Keyword[]
   - upsertKeyword(data: UpsertKeywordInput) → Keyword
   - bulkUpsertKeywords(clientId: string, keywords: UpsertKeywordInput[]) → void
   - getKeywordTrends(clientId: string) → KeywordTrend[]

4. packages/db/queries/queue.ts:
   - getQueueItems(filters: QueueFilters) → AgentAction[]
     Filters: clientId?, status?, severity?, actionType?, limit?, offset?
   - getQueueItemById(actionId: string) → AgentAction | null
   - approveQueueItem(actionId: string, approvedBy: string) → AgentAction
   - rejectQueueItem(actionId: string) → AgentAction
   - bulkApprove(actionIds: string[], approvedBy: string) → AgentAction[]
   - getPendingCount(orgId?: string) → number

5. packages/db/queries/leads.ts:
   - createLead(data: CreateLeadInput) → Lead
   - getLeads(filters?: { converted?, minScore? }) → Lead[]
   - markLeadConverted(leadId: string) → void

6. packages/db/queries/gbp-posts.ts:
   - getGBPPosts(clientId: string) → GBPPost[]
   - createGBPPost(data: CreateGBPPostInput) → GBPPost
   - updateGBPPost(postId: string, data: Partial<GBPPost>) → GBPPost
   - getScheduledPosts() → GBPPost[] (admin, all orgs, for cron)

7. packages/db/queries/agent-runs.ts:
   - createRun(data: CreateRunInput) → AgentRun
   - updateRun(runId: string, data: Partial<AgentRun>) → void
   - getRunsByClient(clientId: string) → AgentRun[]
   - getActiveRuns() → AgentRun[] (admin, for monitoring)

Each function must:
- Use proper TypeScript types (import from packages/db/types.ts)
- Define Zod schemas for input validation where applicable
- Handle errors with meaningful error messages
- Use supabaseServer() for user-facing queries (respects RLS)
- Use supabaseAdmin for agent/server queries (bypasses RLS)
- Log errors to console.error with context

Also create packages/db/queries/index.ts that re-exports everything.
```

**Acceptance Criteria:**
- [ ] All 7 query modules export the listed functions
- [ ] All functions have correct TypeScript return types (no `any`)
- [ ] Zod schemas defined for create/update inputs
- [ ] `supabaseServer` used for user-facing, `supabaseAdmin` for agent operations
- [ ] `npx tsc --noEmit` passes
- [ ] Each query module can be imported without circular dependencies

---

### TASK-05: API Route Scaffolding

**Hand to Claude Code:**

```
Create ALL API route files for the Zintas pilot. Each route should
have the correct HTTP method handler with auth checks, input validation,
and a TODO comment for the business logic.

For every route:
- Import auth() from @clerk/nextjs/server
- Check authentication (return 401 if not authed, except public routes)
- Check orgRole where applicable (return 403 if wrong role)
- Use Zod to validate request body (POST/PUT routes)
- Return proper HTTP status codes
- Wrap in try/catch, return 500 with error message on failure

Create these route files:

PUBLIC (no auth):
  app/api/audit/free/route.ts — POST: run free audit
  app/api/audit/free/[id]/route.ts — GET: get audit results

ONBOARDING (auth required, no org check):
  app/api/onboarding/create-org/route.ts — POST: create Clerk org + client
  app/api/onboarding/google-oauth/route.ts — POST: initiate OAuth flow
  app/api/onboarding/google-oauth/callback/route.ts — GET: handle OAuth callback
  app/api/onboarding/detect-cms/route.ts — POST: auto-detect CMS from URL
  app/api/onboarding/competitors/route.ts — POST: auto-suggest competitors
  app/api/onboarding/complete/route.ts — POST: mark onboarding complete

PRACTICE (practice_owner role):
  app/api/practice/dashboard/route.ts — GET: dashboard KPI data
  app/api/practice/content/route.ts — GET: content library
  app/api/practice/content/[id]/route.ts — GET: single content piece
  app/api/practice/reports/route.ts — GET: performance data
  app/api/practice/profile/route.ts — GET + PUT: practice profile

MANAGER (manager role):
  app/api/clients/route.ts — GET (list all) + POST (create client)
  app/api/clients/[id]/route.ts — GET + PUT: single client
  app/api/queue/route.ts — GET: queue items with filters
  app/api/queue/[id]/approve/route.ts — POST: approve item
  app/api/queue/[id]/reject/route.ts — POST: reject item
  app/api/queue/bulk-approve/route.ts — POST: bulk approve
  app/api/content/[id]/route.ts — GET + PUT: content for editor
  app/api/content/[id]/publish/route.ts — POST: publish to CMS
  app/api/keywords/[clientId]/route.ts — GET: keywords for client
  app/api/agents/run/route.ts — POST: manually trigger agent
  app/api/agents/runs/[clientId]/route.ts — GET: agent run history
  app/api/leads/route.ts — GET: all leads
  app/api/gbp/[clientId]/posts/route.ts — GET + POST: GBP posts

AGENT INTERNAL (API key auth):
  app/api/agents/scholar/run/route.ts — POST: trigger Scholar
  app/api/agents/ghostwriter/run/route.ts — POST: trigger Ghostwriter
  app/api/agents/conductor/run/route.ts — POST: trigger Conductor
  app/api/agents/analyst/snapshot/route.ts — POST: capture metrics
  app/api/compliance/check/route.ts — POST: check content compliance

For agent internal routes, validate using AGENT_API_KEY header instead of Clerk auth.

Each route handler should call the appropriate query from packages/db/queries/
with a TODO for any complex business logic not yet implemented.
```

**Acceptance Criteria:**
- [ ] All 30 route files created
- [ ] Every route has correct HTTP method (GET/POST/PUT)
- [ ] Public routes don't check auth
- [ ] Practice routes check for `org:practice_owner` role
- [ ] Manager routes check for `org:manager` role
- [ ] Agent routes check for `AGENT_API_KEY` header
- [ ] Zod schemas defined for all POST/PUT request bodies
- [ ] `npx tsc --noEmit` passes
- [ ] Visiting `/api/clients` without auth returns 401

---

### TASK-06: Encryption Utility

**Hand to Claude Code:**

```
Create a utility for encrypting and decrypting sensitive data (Google tokens, CMS credentials).

Create file: packages/db/encryption.ts

Requirements:
- Use Node.js crypto module with AES-256-GCM
- Key from process.env.ENCRYPTION_KEY (32-byte hex string)
- Export functions:
  encrypt(data: Record<string, any>): string
    — JSON stringify → encrypt → return base64 string (includes IV + auth tag)
  decrypt(encrypted: string): Record<string, any>
    — decode base64 → decrypt → JSON parse → return object

- The encrypted string format should be: iv:authTag:ciphertext (all base64)
- IV should be randomly generated for each encryption (12 bytes)
- Auth tag should be 16 bytes

Also create:
  encryptTokens(tokens: GoogleTokens): string
  decryptTokens(encrypted: string): GoogleTokens

Where GoogleTokens is:
  { access_token: string; refresh_token: string; expiry_date: number; scope: string }

Write unit tests in packages/db/encryption.test.ts:
- Test round-trip: encrypt then decrypt returns original data
- Test with nested objects
- Test with special characters in values
- Test that two encryptions of the same data produce different ciphertexts (random IV)
- Test that decrypting tampered data throws an error
- Test that missing ENCRYPTION_KEY throws a clear error message
```

**Acceptance Criteria:**
- [ ] `encrypt()` and `decrypt()` work as round-trip
- [ ] Each encryption produces different ciphertext (random IV)
- [ ] Tampered data throws error on decrypt
- [ ] All 6 unit tests pass
- [ ] `npx tsc --noEmit` passes

---

### TASK-07: Rate Limiting Utility

**Hand to Claude Code:**

```
Create rate limiting utilities using Upstash Redis.

Create file: packages/db/rate-limit.ts

Export these rate limiters:
1. auditRateLimiter — 3 requests per hour per IP (for free audit tool)
2. apiRateLimiter — 100 requests per minute per user (for authenticated APIs)
3. agentRateLimiter — 10 requests per minute per client (for SE Ranking API calls)

Each should use @upstash/ratelimit with sliding window algorithm.

Also create a helper function:
  checkRateLimit(limiter, identifier: string): Promise<{ success: boolean; remaining: number; reset: number }>

Create file: app/lib/rate-limit-middleware.ts
Export a function withRateLimit(limiter, identifierFn) that can wrap API route handlers:
  - Extract identifier from request (IP for public, userId for auth)
  - Check rate limit
  - Return 429 with Retry-After header if exceeded
  - Continue to handler if allowed

Include X-RateLimit-Remaining and X-RateLimit-Reset headers in all responses.
```

**Acceptance Criteria:**
- [ ] Three rate limiters exported with correct configurations
- [ ] `withRateLimit` returns 429 with proper headers when exceeded
- [ ] `withRateLimit` passes through when under limit
- [ ] Headers include X-RateLimit-Remaining
- [ ] `npx tsc --noEmit` passes

---

### TASK-08: Shared UI Components

**Hand to Claude Code:**

```
Create shared UI components used across multiple screens.
These go in app/components/ and will be used by both Bolt-imported
screens and custom screens.

1. app/components/health-score-gauge.tsx
   - Circular gauge component showing 0-100 score
   - Props: score (number), size ('sm' | 'md' | 'lg')
   - Color: red <60, yellow 60-80, green >80
   - Uses SVG for the circular arc
   - Shows number in center

2. app/components/severity-badge.tsx
   - Badge component for critical/warning/info severity
   - Props: severity ('critical' | 'warning' | 'info')
   - Red dot + text for critical, yellow for warning, blue for info

3. app/components/trend-indicator.tsx
   - Shows up/down arrow with percentage change
   - Props: current (number), previous (number)
   - Green up arrow if improved, red down arrow if worsened, gray dash if same

4. app/components/kpi-card.tsx
   - Reusable KPI metric card
   - Props: title, value, subtitle, trend (optional), sparklineData (optional)
   - Uses recharts for optional sparkline
   - Responsive

5. app/components/approval-card.tsx
   - Plain-English approval card for practice portal
   - Props: type ('content'|'fix'|'seo'), title, benefit, icon, timestamp,
     onApprove, onReject, onPreview
   - Color-coded left border by type
   - Friendly language, no technical jargon

6. app/components/agent-timeline.tsx
   - Vertical timeline of agent actions
   - Props: items (array of { agent, description, timestamp, status })
   - Color-coded dots by agent
   - Relative timestamps using date-fns formatDistanceToNow

7. app/components/empty-state.tsx
   - Reusable empty state component
   - Props: icon (Lucide icon name), title, description, actionLabel?, onAction?
   - Centered, friendly design

8. app/components/compliance-badge.tsx
   - Shows compliance status
   - Props: status ('pass' | 'warn' | 'block'), details? (array)
   - Green checkmark for pass, yellow triangle for warn, red X for block
   - Clickable to show details in a popover

All components must:
- Use shadcn/ui primitives where applicable
- Be fully typed with TypeScript
- Include JSDoc comments with prop descriptions
- Be responsive (mobile-friendly)
- Use Tailwind CSS only (no CSS modules or styled-components)
```

**Acceptance Criteria:**
- [ ] All 8 components created and exported
- [ ] Each component renders without errors
- [ ] TypeScript types defined for all props
- [ ] No `any` types
- [ ] Components use shadcn/ui primitives where possible
- [ ] `npx tsc --noEmit` passes

---

## PHASE 1: Marketing + Audit Engine (Week 3)

---

### TASK-09: Free Audit Engine Backend

**Hand to Claude Code:**

```
Build the free SEO audit engine that powers the /audit page.

Create file: packages/audit-engine/index.ts

The audit engine runs 7 checks on a given URL and returns a score (0-100)
with findings per category.

Checks to implement:

1. checkPageSpeed(url): Call Google PageSpeed Insights API
   GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile
   Extract performance score. Scale to 0-20 points.

2. checkMobileFriendly(url): Use PageSpeed accessibility category.
   Scale to 0-15 points. Pass if score >= 70.

3. checkMetaTags(url): Fetch the URL, parse HTML <head>.
   Check for: <title> (5pts), <meta name="description"> (5pts), og:tags (5pts).
   Total: 0-15 points.

4. checkSchemaMarkup(url): Fetch URL, check for:
   application/ld+json in HTML (5pts), dental/medical specific schema (10pts).
   Total: 0-10 points.

5. checkGBP(url): Use Google Places Text Search API to find a business
   matching the domain. If found: 10 points. If not found: 0.
   Handle API failures gracefully (return 5 pts with 'manual verification needed').

6. checkSSL(url): Check if URL uses HTTPS. 5 points if yes, 0 if no.

7. checkHeadingStructure(url): Parse HTML for H1-H6 tags.
   5 points if proper hierarchy (exactly one H1, H2s follow).
   0 if no H1 or broken hierarchy.

Total possible: 100 points.
Grade: A (>=90), B (75-89), C (60-74), D (40-59), F (<40).

Export: runAudit(url: string): Promise<AuditResult>
Where AuditResult = { score, grade, findings: Finding[] }
Each Finding = { category, icon, score, maxScore, status: 'pass'|'warning'|'fail',
  finding: string, recommendation: string }

Run all checks in parallel with Promise.allSettled.
If any check fails, return partial results with that check marked as 'error'.
Set a 15-second timeout per individual check.

Also create: packages/audit-engine/audit-engine.test.ts
Test with a well-known URL (example.com or similar).
Test error handling when URL is unreachable.
Test rate limiting integration.
```

**Acceptance Criteria:**
- [ ] `runAudit('https://example.com')` returns a valid AuditResult
- [ ] Score is between 0-100
- [ ] Grade is one of A/B/C/D/F
- [ ] All 7 findings present in results
- [ ] Individual check failure doesn't crash the whole audit
- [ ] Audit completes in under 30 seconds
- [ ] `npx tsc --noEmit` passes

---

### TASK-10: Audit API Route (Wired)

**Hand to Claude Code:**

```
Wire the free audit API route to the audit engine.

Update file: app/api/audit/free/route.ts

POST handler:
1. Rate limit: 3 per hour per IP using auditRateLimiter
2. Validate input with Zod: { url: string (valid URL), email?: string (valid email), recaptchaToken: string }
3. Verify reCAPTCHA token with Google (POST to https://www.google.com/recaptcha/api/siteverify)
   If verification fails, return 400
4. Call runAudit(url) from packages/audit-engine
5. Hash the IP (SHA-256) for storage
6. Store result in leads table: domain, email (if provided), audit_score, audit_results, source (from referer header), ip_hash
7. If email provided, send audit results email using Resend (create a simple React Email template)
8. Return: { id: lead.id, score, grade, findings }
   If no email was provided, redact some findings details (only show category + status, not full recommendation) to incentivize email entry

Update file: app/api/audit/free/[id]/route.ts
GET handler:
1. No auth required
2. Look up lead by id
3. Return audit results
4. If the lead has no email, return limited results (same redaction as above)

Create file: packages/audit-engine/emails/audit-results.tsx
React Email template for audit results:
- Zintas branding header
- "Your website scored X/100 (Grade: Y)"
- Summary of 7 findings (category, pass/fail icon, one-line finding)
- CTA button: "Fix These Issues — Start Your Free Trial"
- Unsubscribe link footer
```

**Acceptance Criteria:**
- [ ] POST `/api/audit/free` with valid URL returns audit results
- [ ] Rate limited: 4th request within 1 hour returns 429
- [ ] Lead stored in database with score and findings
- [ ] Email sent when email is provided (check Resend dashboard)
- [ ] Results are redacted when no email provided
- [ ] GET `/api/audit/free/[id]` returns stored results
- [ ] Invalid URL returns 400 with error message
- [ ] `npx tsc --noEmit` passes

---

### TASK-11: ROI Calculator Component

**Hand to Claude Code:**

```
Create the interactive ROI calculator for the homepage pricing section.

Create file: app/components/roi-calculator.tsx

'use client' component with:
- Three input sliders (shadcn/ui Slider component):
  1. "Average patient lifetime value" — range $1,000 to $10,000, step $500, default $3,000
  2. "Current monthly new patients" — range 1 to 50, step 1, default 10
  3. "Target monthly growth" — range 10% to 100%, step 5%, default 30%

- Each slider shows: label, current value formatted as currency/percentage, slider control

- Output card (green gradient background):
  Large number: "Estimated additional monthly revenue: $X,XXX"
  Calculation: additionalPatients = currentPatients × (growthTarget / 100)
               monthlyRevenue = additionalPatients × patientValue
  Comparison line: "vs. Average agency cost: $4,200/month"
  Savings line: "Zintas Pro saves you: $3,701/month" (agency cost - $499)

- Animated number transitions when sliders change

Use React useState for all slider values.
Format all currency with toLocaleString().
```

**Acceptance Criteria:**
- [ ] All three sliders render and are interactive
- [ ] Output updates immediately when any slider changes
- [ ] Currency values formatted with $ and commas
- [ ] Percentage values formatted with %
- [ ] Calculation is mathematically correct
- [ ] Responsive on mobile (sliders stack vertically)
- [ ] `npx tsc --noEmit` passes

---

### TASK-12: Wire Homepage

**Hand to Claude Code:**

```
Take the Bolt-scaffolded homepage (already in app/(public)/page.tsx)
and wire it with real functionality.

Updates needed:

1. Import and render the ROICalculator component in the pricing section
2. "Get Free SEO Audit" button links to /audit
3. "Start Free Trial" button links to /sign-up
4. Update FAQ accordion with these real questions and answers:
   Q: "How does AI replace a marketing agency?"
   Q: "Will the content sound like my practice?"
   Q: "How long until I see results?"
   Q: "Do I need any technical knowledge?"
   Q: "Can I cancel anytime?"
   Q: "Is my data safe?"
   (Write genuine, helpful answers for each — 2-3 sentences)
5. Social proof: replace placeholder logos with "500+ dental practices trust Zintas"
   Use generic dental-themed placeholders
6. Testimonials: write 3 realistic (but fictional) dentist testimonials
7. Ensure all links work and CTAs point to correct routes
8. Mobile responsive: test all sections stack properly on small screens
```

**Acceptance Criteria:**
- [ ] ROI calculator renders and calculates correctly
- [ ] All CTA buttons link to correct routes
- [ ] FAQ accordion opens/closes with real content
- [ ] Page is fully responsive
- [ ] No broken images or missing icons
- [ ] `npx tsc --noEmit` passes

---

### TASK-13: Wire Audit Tool Page

**Hand to Claude Code:**

```
Take the Bolt-scaffolded audit tool page (app/(public)/audit/page.tsx)
and wire it to the real audit API.

Updates needed:

1. Step 1 (Input Form):
   - URL input with validation (must be a valid URL or domain)
   - Email input (optional, but show message: "Enter email to see full results")
   - reCAPTCHA v3 integration (invisible, score-based)
   - "Run My Free Audit" button triggers POST /api/audit/free
   - Loading state on button while request is in flight
   - Error handling: show error message if URL is invalid or rate limited

2. Step 2 (Scanning):
   - Show animated progress while audit runs
   - Use Server-Sent Events or polling (poll /api/audit/free/[id] every 2s)
   - OR: just await the POST response (simpler — audit takes ~15-20 seconds)
   - Show checklist items appearing one by one with checkmarks
   - Display "Analyzing your website..." with progress animation

3. Step 3 (Results):
   - Display circular score gauge with color coding
   - Display grade badge (A-F)
   - Map 7 findings to the finding cards
   - Each card: category icon, name, pass/fail/warning badge, finding text, recommendation
   - If no email was provided: findings show limited detail + "Enter your email to see full recommendations"
   - CTA: "Fix These Automatically — Start Your Free Trial" → links to /sign-up
   - "Email me this report" button: if email already provided, trigger email send; if not, show email input

State management: use React useState to track current step (1, 2, 3),
audit results, loading state, and errors.

Handle edge cases:
- User enters URL without https:// — prepend it
- User enters just a domain (smithdental.com) — add https://
- Audit takes longer than 30s — show "Taking longer than expected..."
- API returns 429 — show "Too many requests. Please try again in an hour."
```

**Acceptance Criteria:**
- [ ] Enter a URL → scan runs → results display
- [ ] Score gauge renders with correct color
- [ ] 7 finding cards display with correct icons and status
- [ ] Email capture works
- [ ] "Start Free Trial" CTA links to /sign-up
- [ ] Error states display properly (invalid URL, rate limited)
- [ ] Loading/scanning animation shows during audit
- [ ] `npx tsc --noEmit` passes

---

## PHASE 2: Auth + Onboarding (Week 4)

---

### TASK-14: Google OAuth Flow

**Hand to Claude Code:**

```
Implement the Google OAuth multi-scope flow for connecting
Google Search Console, Google Analytics, and Google Business Profile.

1. Update: app/api/onboarding/google-oauth/route.ts
   POST handler:
   - Requires authentication (check auth())
   - Generate Google OAuth URL with these scopes:
     https://www.googleapis.com/auth/webmasters.readonly
     https://www.googleapis.com/auth/analytics.readonly
     https://www.googleapis.com/auth/business.manage
   - Use GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI from env
   - Set access_type=offline, prompt=consent
   - Pass userId as state parameter for callback verification
   - Return { url: authorizationUrl }

2. Update: app/api/onboarding/google-oauth/callback/route.ts
   GET handler:
   - Extract code and state from query params
   - Exchange code for tokens via POST https://oauth2.googleapis.com/token
   - Verify state matches the expected userId
   - Encrypt tokens using encryptTokens() from packages/db/encryption.ts
   - Get the client record for this user's org
   - Update client.google_tokens with encrypted tokens
   - Set client.account_health = 'active'
   - Test each scope by making a lightweight API call:
     GSC: list sites → store which sites are accessible
     GA: list accounts → store account info
     GBP: list accounts.locations → store location info
   - Redirect to /onboarding/start?step=3&google=connected
     Include query params for connection status: &gsc=true&ga=true&gbp=true

3. Create: packages/db/google-tokens.ts
   Export:
   - refreshTokenIfNeeded(clientId: string): Promise<DecryptedTokens>
     Check if access_token is expired (expiry_date < Date.now())
     If expired, call https://oauth2.googleapis.com/token with refresh_token
     Update stored tokens with new access_token and expiry_date
     If refresh fails, set account_health = 'disconnected'
     Return decrypted tokens

   - revokeTokens(clientId: string): Promise<void>
     Call https://oauth2.googleapis.com/revoke with token
     Clear stored tokens

Handle errors:
- If user denies permission: redirect to onboarding with error message
- If token exchange fails: redirect with error
- If any scope test fails: still succeed, but note which scopes are missing
```

**Acceptance Criteria:**
- [ ] POST `/api/onboarding/google-oauth` returns a valid Google OAuth URL
- [ ] OAuth URL includes all 3 scopes
- [ ] Callback exchanges code for tokens successfully
- [ ] Tokens are encrypted before storage
- [ ] Scope verification makes test API calls
- [ ] Token refresh works when access_token is expired
- [ ] Failed refresh sets account_health to 'disconnected'
- [ ] `npx tsc --noEmit` passes

---

### TASK-15: CMS Auto-Detection

**Hand to Claude Code:**

```
Implement CMS auto-detection service that identifies what CMS
a dental practice website runs on.

Create file: packages/audit-engine/detect-cms.ts

Export function: detectCMS(domain: string): Promise<CMSResult>

CMSResult type:
{
  cms: 'wordpress' | 'wix' | 'squarespace' | 'webflow' | 'ghl' | 'custom' | 'unknown' | 'error',
  confidence: 'high' | 'medium' | 'low' | 'none',
  apiAvailable: boolean,
  version?: string,
  setupInstructions: string,
}

Detection logic (check in this order):

1. WordPress:
   - Check HTML for "wp-content" or "wp-includes" strings
   - Check X-Powered-By header for "WordPress"
   - Check /wp-json/ endpoint existence (HEAD request)
   - If found: confidence='high', check if REST API responds at /wp-json/wp/v2/posts
   - Instructions: "Your site runs WordPress. We need an Application Password to publish content. Go to Users → Profile → Application Passwords in your WordPress admin."

2. Wix:
   - Check HTML for "wix.com" or "X-Wix-" headers
   - Instructions: "Your site runs Wix. We'll use the Wix Content API. You'll need to connect your Wix account."

3. Squarespace:
   - Check HTML for "squarespace.com" or "sqsp"
   - Instructions: "Your site runs Squarespace. Automated content publishing is limited. We'll prepare content for you to paste."

4. Webflow:
   - Check HTML for "webflow.com" or "wf-" prefixed classes
   - Instructions: "Your site runs Webflow. We'll use the Webflow CMS API to publish content."

5. GoHighLevel (GHL):
   - Check for GHL-specific markers
   - Instructions: "Your site runs GoHighLevel. We'll integrate via the GHL API."

6. If none matched: cms='unknown', instructions='We couldn\'t detect your CMS. Please select it manually.'

Timeout: 10 seconds per request. Handle CORS/firewall issues by trying
multiple User-Agent strings. Handle redirects (follow up to 5).

Update: app/api/onboarding/detect-cms/route.ts
POST handler: accepts { domain: string }, calls detectCMS, returns result.

Write tests in packages/audit-engine/detect-cms.test.ts:
- Test with a known WordPress site (e.g., wordpress.org)
- Test with an invalid domain
- Test timeout handling
```

**Acceptance Criteria:**
- [ ] Correctly identifies WordPress sites
- [ ] Returns setup instructions for each CMS type
- [ ] Handles unreachable domains gracefully
- [ ] Timeout works (doesn't hang indefinitely)
- [ ] POST `/api/onboarding/detect-cms` returns CMS result
- [ ] `npx tsc --noEmit` passes

---

### TASK-16: Onboarding - Org Creation

**Hand to Claude Code:**

```
Implement the organization creation step of onboarding.

Update: app/api/onboarding/create-org/route.ts

POST handler accepts:
{
  practiceName: string,
  domain: string,
  vertical: string (e.g., 'general_dentistry', 'orthodontics', 'cosmetic'),
  address: string,
  managementMode: 'managed' | 'self_service' (default: 'self_service' for self-signup)
}

Logic:
1. Validate input with Zod
2. Create Clerk Organization:
   - Name: practiceName
   - Add current user as member with role 'org:practice_owner'
3. Create client record in Supabase:
   - org_id: Clerk org ID
   - name: practiceName
   - domain: domain
   - management_mode: managementMode
   - vertical: vertical
   - practice_profile: { address, vertical }
   - onboarding_step: 2 (they completed step 1)
4. Auto-detect CMS from domain (call detectCMS)
   - Store cms_type in client record
5. Return: { orgId, clientId, cmsResult }

Handle errors:
- If Clerk org creation fails, return 500 with message
- If domain already exists as a client, return 409 "Practice already registered"
```

**Acceptance Criteria:**
- [ ] Creates Clerk Organization with correct name
- [ ] Adds user as practice_owner member
- [ ] Creates client record in Supabase
- [ ] CMS auto-detection runs and stores result
- [ ] Duplicate domain returns 409
- [ ] `npx tsc --noEmit` passes

---

### TASK-17: Onboarding - Competitor Suggestions

**Hand to Claude Code:**

```
Implement auto-suggestion of local competitors during onboarding.

Update: app/api/onboarding/competitors/route.ts

POST handler accepts:
{
  clientId: string,
  location: string (city, state),
  vertical: string
}

Logic:
1. Validate input
2. Use Google Places Text Search API to find dental practices near the location:
   Query: "{vertical} in {location}" (e.g., "dentist in Bentonville, AR")
   Return top 5 results
3. For each result, extract: name, address, domain (from website field), placeId
4. Filter out the client's own practice (match by domain)
5. If SE Ranking API is configured, also get basic SEO data for each competitor
6. Return: { competitors: [{ name, domain, address, distance?, seMetrics? }] }
7. Update client.competitors in Supabase with the selected competitors

Also handle: POST to finalize competitor selection
{
  clientId: string,
  competitors: [{ name: string, domain: string }]  // user's final selection
}
Save to client.competitors and advance onboarding_step to 4.

Create file: packages/audit-engine/competitor-finder.ts
Export: findCompetitors(location, vertical, excludeDomain) → Competitor[]
```

**Acceptance Criteria:**
- [ ] Returns 3-5 competitor suggestions for a given location
- [ ] Excludes the client's own practice
- [ ] Competitor data saved to client record
- [ ] Works for real locations (test with a real city)
- [ ] Handles cases where fewer than 3 competitors found
- [ ] `npx tsc --noEmit` passes

---

### TASK-18: Onboarding - Complete

**Hand to Claude Code:**

```
Implement the onboarding completion step.

Update: app/api/onboarding/complete/route.ts

POST handler accepts:
{
  clientId: string
}

Logic:
1. Validate the client exists and belongs to the current user's org
2. Check that minimum requirements are met:
   - practice_profile has name and address
   - At least 1 competitor configured
   - Either google_tokens are set OR onboarding was explicitly skipped
3. Update client:
   - onboarding_step: null (complete)
   - onboarding_completed_at: now()
4. Trigger initial Scholar agent run (async — don't wait for completion):
   - Create agent_runs record with trigger='onboarding'
   - Queue the Conductor pipeline for this client
5. Send welcome email via Resend:
   - "Welcome to Zintas AI! Your marketing team is getting to work."
   - Include dashboard login link
   - "In the next 24 hours we'll: research keywords, analyze competitors, start writing content"
6. Return: { success: true, redirectTo: '/practice/dashboard' }

Create file: packages/audit-engine/emails/welcome.tsx
React Email template with Zintas branding, welcome message, and dashboard CTA.
```

**Acceptance Criteria:**
- [ ] Onboarding marked complete in database
- [ ] Agent run created and queued
- [ ] Welcome email sent
- [ ] Redirect URL returned
- [ ] Minimum requirements validated
- [ ] Incomplete onboarding (no competitors) returns 400
- [ ] `npx tsc --noEmit` passes

---

### TASK-19: Wire Onboarding Wizard UI

**Hand to Claude Code:**

```
Take the Bolt-scaffolded onboarding wizard (app/(onboarding)/onboarding/start/page.tsx)
and wire it to the real APIs.

This is a 'use client' page with multi-step form state.

Step 1 (Your Practice):
- Form fields: practiceName, websiteURL, practiceType (card selection), location (address input)
- On "Next": POST /api/onboarding/create-org
- Store returned orgId and clientId in state
- Show CMS detection result (auto-detected from domain)

Step 2 (Connect Google):
- "Connect with Google" button: POST /api/onboarding/google-oauth → redirect to Google
- After redirect back: check URL params for connection status
- Show status for each service (GSC, GA, GBP) with green check or gray pending
- "Skip for now" link: advance to step 3 without tokens
- Show CMS setup instructions based on detected CMS type

Step 3 (Competitors):
- On mount: POST /api/onboarding/competitors to get suggestions
- Show suggested competitors as cards with checkboxes
- User can select/deselect, add custom competitor (domain input)
- Max 5 competitors
- On "Next": save selected competitors

Step 4 (Choose Plan):
- Show 3 plan cards (cosmetic for pilot — all free)
- Pre-select "Pro" with "Recommended" badge
- "No charge during pilot" message
- On "Next": advance to step 5

Step 5 (Launch):
- Summary card with all selections
- "Launch My AI Marketing Team" button: POST /api/onboarding/complete
- Success: redirect to /practice/dashboard
- Show loading state while APIs process

Use react-hook-form for form management.
Use useState for currentStep (1-5).
Persist progress: if user refreshes, check client.onboarding_step and resume.
Show error toasts for API failures (use shadcn toast component).
Add "Back" button on steps 2-5 to go to previous step.
```

**Acceptance Criteria:**
- [ ] All 5 steps render and navigate correctly
- [ ] Step 1 creates org and client
- [ ] Step 2 initiates Google OAuth and shows connection status
- [ ] Step 3 shows competitor suggestions and saves selection
- [ ] Step 5 completes onboarding and redirects to dashboard
- [ ] Progress persists on page refresh
- [ ] Back button works on all steps
- [ ] Error states show toast notifications
- [ ] `npx tsc --noEmit` passes

---

## PHASE 3: Scholar Agent (Week 5)

---

### TASK-20: SE Ranking API Client

**Hand to Claude Code:**

```
Create the SE Ranking API client for keyword research and rank tracking.

Create file: packages/agents/integrations/se-ranking.ts

SE Ranking API base URL: https://api.seranking.com
Auth: API key in X-Api-Key header

Export class SERankingClient with methods:

1. keywordResearch(keywords: string[]): Promise<KeywordData[]>
   POST /research/keywords
   Returns: keyword, search_volume, difficulty, cpc, competition
   Rate limit: add 500ms delay between batch requests

2. getCompetitorKeywords(domain: string): Promise<KeywordData[]>
   GET /research/competitors?domain={domain}
   Returns organic keywords the domain ranks for

3. createProject(name: string, domain: string): Promise<string>
   POST /projects — create a tracking project
   Returns project ID

4. addKeywordsToProject(projectId: string, keywords: string[]): Promise<void>
   POST /projects/{id}/keywords
   Add keywords for rank tracking (max 50 per batch)

5. getPositions(projectId: string): Promise<PositionData[]>
   GET /projects/{id}/positions
   Returns current positions for tracked keywords

6. bulkKeywordResearch(seeds: string[]): Promise<KeywordData[]>
   Research up to 100 keywords in batches of 10 with delay
   Deduplicate results

Types needed:
- KeywordData: { keyword, searchVolume, difficulty, cpc, competition }
- PositionData: { keyword, position, previousPosition, url, searchVolume }

Handle errors: if API returns 429 (rate limit), wait and retry.
If API returns 401, throw clear error about invalid API key.
If API returns 500, retry once after 2 seconds.

All methods should use the agentRateLimiter from TASK-07.

Write tests in packages/agents/integrations/se-ranking.test.ts:
- Mock the API responses
- Test rate limit handling
- Test error handling for 401, 429, 500
```

**Acceptance Criteria:**
- [ ] All 6 methods exported
- [ ] Rate limiting implemented with 500ms delays
- [ ] Error handling for 401, 429, 500
- [ ] TypeScript types for all return values
- [ ] Tests pass with mocked API
- [ ] `npx tsc --noEmit` passes

---

### TASK-21: Google Search Console Client

**Hand to Claude Code:**

```
Create the Google Search Console API client.

Create file: packages/agents/integrations/google-search-console.ts

Export class GSCClient with methods:

1. getTopQueries(tokens: DecryptedTokens, params: { siteUrl: string, startDate: string, endDate: string, rowLimit?: number }): Promise<GSCQuery[]>
   Uses Search Analytics API: POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
   Request body: { startDate, endDate, rowLimit, dimensions: ['query'] }
   Returns: query, clicks, impressions, ctr, position

2. getTopPages(tokens: DecryptedTokens, params: same): Promise<GSCPage[]>
   Same API but dimensions: ['page']
   Returns: page, clicks, impressions, ctr, position

3. getQueryTrends(tokens: DecryptedTokens, params: { siteUrl: string, query: string, months: number }): Promise<TrendData[]>
   Get monthly data points for a specific query
   Returns: date, clicks, impressions, position

4. getSiteList(tokens: DecryptedTokens): Promise<string[]>
   GET https://www.googleapis.com/webmasters/v3/sites
   Returns list of verified site URLs

All methods must:
- Call refreshTokenIfNeeded() before every API call
- Handle 401 (token expired) by refreshing and retrying once
- Handle 403 (no access) with clear error
- Format dates as YYYY-MM-DD strings
```

**Acceptance Criteria:**
- [ ] All 4 methods exported with correct types
- [ ] Token refresh called before each API request
- [ ] 401 triggers automatic refresh + retry
- [ ] Date formatting correct
- [ ] `npx tsc --noEmit` passes

---

### TASK-22: Scholar Agent - LangGraph Implementation

**Hand to Claude Code:**

```
Implement the Scholar agent as a LangGraph StateGraph.

Create file: packages/agents/scholar/graph.ts

The Scholar agent researches keywords for a dental practice and generates
content topic recommendations.

State definition (ScholarState):
- clientId: string
- orgId: string  
- runId: string
- practiceProfile: object (from client.practice_profile)
- siteUrl: string (for GSC)
- gscData: GSCQuery[] (queries from Search Console)
- researchedKeywords: KeywordData[] (from SE Ranking)
- competitorKeywords: Array<{ competitor: string, keywords: KeywordData[] }>
- gapAnalysis: KeywordData[] (keywords competitors rank for, we don't)
- prioritizedKeywords: PrioritizedKeyword[] (top opportunities)
- contentTopics: ContentTopic[] (suggested blog post topics)
- error: string | null

Graph nodes (implement each as an async function):

1. fetch_gsc_data:
   - Get client's Google tokens from DB, decrypt
   - Call GSCClient.getTopQueries() for last 90 days
   - Store in state.gscData

2. research_keywords:
   - Generate seed keywords from practice_profile:
     For each service + location combo: "{service} {city}", "{service} near me",
     "best {service} {city}", "{service} cost"
   - Call SERankingClient.bulkKeywordResearch(seeds)
   - Store in state.researchedKeywords

3. analyze_competitors:
   - Get client's competitors from DB
   - For each competitor, call SERankingClient.getCompetitorKeywords(domain)
   - Store in state.competitorKeywords

4. gap_analysis:
   - Build set of our keywords (from GSC + research)
   - Find keywords competitors rank for that we don't
   - Filter to volume > 50 and difficulty < 60
   - Sort by volume descending, take top 50
   - Store in state.gapAnalysis

5. prioritize:
   - Use Claude Sonnet to rank keyword opportunities
   - System prompt: "You are a dental SEO strategist. Rank keywords by
     priority considering: search volume, difficulty, local intent,
     relevance to this practice's specific services."
   - Input: all keywords + practice profile
   - Ask Claude to return JSON: top 30 prioritized keywords and top 5 content topics
   - Each content topic: { keyword, suggestedTitle, angle, estimatedVolume }
   - Store in state.prioritizedKeywords and state.contentTopics

6. save_results:
   - Upsert all prioritized keywords to keywords table
   - Update agent_runs with status='completed', result summary
   - Create agent_action entries for notable findings (e.g., "Found 8 keyword gaps with 500+ monthly searches")

Graph edges:
  START → fetch_gsc_data → research_keywords → analyze_competitors → gap_analysis → prioritize → save_results → END

Error handling: if any node throws:
- Log error
- Set state.error
- Update agent_run status to 'failed' with error message
- Skip to END

Export: createScholarGraph() → compiled LangGraph

Also create: packages/agents/scholar/index.ts
Export: runScholar(clientId: string, orgId: string) → Promise<ScholarResult>
  Creates agent_run record, invokes graph, returns result.
```

**Acceptance Criteria:**
- [ ] `createScholarGraph()` returns a compiled LangGraph
- [ ] Graph has 6 nodes connected in sequence
- [ ] `runScholar(clientId, orgId)` creates an agent_run and invokes the graph
- [ ] Keywords are upserted to keywords table after run
- [ ] Content topics generated by Claude are valid JSON
- [ ] Error in any node is caught and logged (doesn't crash process)
- [ ] agent_run status updated to 'completed' or 'failed'
- [ ] `npx tsc --noEmit` passes

---

### TASK-23: Scholar API Route + Manual Trigger

**Hand to Claude Code:**

```
Wire the Scholar agent to be triggerable via API.

Update: app/api/agents/scholar/run/route.ts
POST handler (agent internal auth):
- Validate AGENT_API_KEY header
- Accept { clientId: string }
- Call runScholar(clientId, orgId)
- Return { runId, status: 'started' }

Update: app/api/agents/run/route.ts
POST handler (manager auth):
- Accept { agent: 'scholar' | 'ghostwriter' | 'conductor', clientId: string }
- Validate manager role
- If agent === 'scholar': call runScholar()
- Return { runId, status: 'started' }
- This allows the manager to manually trigger agent runs from the UI

Update: app/api/keywords/[clientId]/route.ts
GET handler (manager auth):
- Fetch all keywords for the client from DB
- Include: keyword, current_position, previous_position, search_volume,
  difficulty, keyword_type, source
- Support query params: ?type=target&sort=position&order=asc
- Return paginated results with total count

Update: app/api/agents/runs/[clientId]/route.ts
GET handler (manager auth):
- Fetch agent_runs for the client
- Sort by started_at descending
- Return: id, agent, status, trigger, result, error, started_at, completed_at
```

**Acceptance Criteria:**
- [ ] POST `/api/agents/scholar/run` triggers a Scholar run
- [ ] POST `/api/agents/run` with agent='scholar' triggers Scholar
- [ ] GET `/api/keywords/[clientId]` returns keyword data
- [ ] GET `/api/agents/runs/[clientId]` returns run history
- [ ] Invalid AGENT_API_KEY returns 401
- [ ] Manager role required for manual trigger
- [ ] `npx tsc --noEmit` passes

---

### TASK-24: Wire Manager Keyword Views

**Hand to Claude Code:**

```
Wire keyword data from the Scholar agent into the Manager UI screens.

Update the Client Overview page (app/(manager)/dashboard/[client]/page.tsx):
- Fetch keywords from /api/keywords/[clientId]
- Display in the "Quick Stats" row:
  "Keywords Ranked" → count of keywords with current_position != null
  "Rankings Improving" → count where current_position < previous_position
- Show top 5 keyword movements in the activity timeline

Create a Keywords tab content (for the Client Overview tabs):
- Table: keyword, current position, previous position, change (with trend arrow),
  search volume, difficulty, type badge
- Sort by: position, volume, change
- Filter by: type (target, tracked, opportunity)
- Color code: green if position improved, red if declined, gray if new

Update Practice Dashboard (app/(practice)/practice/dashboard/page.tsx):
- Fetch from /api/practice/dashboard
- KPI card "Rankings Improving": show count from API
- KPI card "People Who Found You": show from GSC data (via Analyst)
```

**Acceptance Criteria:**
- [ ] Client Overview shows real keyword counts
- [ ] Keywords tab displays table with correct data
- [ ] Trend arrows show green (improved) / red (declined) / gray (new)
- [ ] Sort and filter work
- [ ] Practice dashboard KPI cards show real data
- [ ] `npx tsc --noEmit` passes

---

## PHASE 4: Ghostwriter Agent (Week 6)

---

### TASK-25: Compliance Engine

**Hand to Claude Code:**

```
Build the dental content compliance gate engine.

Create file: packages/compliance/engine.ts

The compliance engine checks dental content for regulatory and safety issues.
It uses two methods: regex rules (fast) and LLM review (nuanced).

Export: complianceEngine.check(html: string, vertical: string): Promise<ComplianceResult>

ComplianceResult type:
{
  status: 'pass' | 'warn' | 'block',
  details: ComplianceDetail[]
}

ComplianceDetail type:
{
  rule: string,
  severity: 'block' | 'warn',
  phrase: string,
  reason: string,
  suggestion?: string,
  disclaimer?: string
}

Step 1 — Rule-based checks (regex):
Define dental rules array:
- medical_advice: pattern matches "diagnos", "prescrib", "you should/must/need to take",
  "will cure", "guaranteed to" → BLOCK
- guaranteed_outcome: "guaranteed", "100%", "always works",
  "permanently fix/solve/cure" → BLOCK
- drug_dosage: "\d+mg", "\d+ml", "take \d+ pills/tablets" → BLOCK
- patient_testimonial_health: "my cavities were reversed",
  "cured my", "fixed my [health condition]" → BLOCK
- price_claim: dollar amounts without asterisk → WARN
  Disclaimer: "*Pricing may vary. Contact our office for current pricing."
- health_info: mentions of treatment, procedure, surgery, extraction,
  implant, root canal → WARN
  Disclaimer: "Consult your dentist for personalized advice."
- before_after: "before and after", "results shown" → WARN
  Disclaimer: "Individual results may vary."
- insurance_claim: "covered by insurance", "insurance pays" → WARN
  Disclaimer: "Contact your insurance provider to verify coverage."

Strip HTML tags before regex matching. Match against plain text only.

Step 2 — LLM check (Claude Haiku):
Send the text (first 3000 chars) to Claude Haiku with prompt:
"Review this dental practice content for compliance issues.
Flag: specific diagnoses, treatment recommendations (as if prescribing),
guaranteed outcomes, testimonials with health claims, unsupported
comparative claims. Return JSON array of issues or empty array."

Combine results from both steps. Deduplicate by phrase.
If ANY block exists → status = 'block'
Else if ANY warn exists → status = 'warn'
Else → status = 'pass'

Create: packages/compliance/engine.test.ts
Test cases:
- Clean dental content → pass
- Content with "This will cure your gum disease" → block
- Content with "$500 teeth whitening" → warn (price without disclaimer)
- Content with treatment mentions + proper disclaimers already → pass
- Content with "guaranteed results" → block
- Empty content → pass
```

**Acceptance Criteria:**
- [ ] `complianceEngine.check()` returns correct status for test cases
- [ ] Block-worthy content returns status='block' with details
- [ ] Warning content returns status='warn' with disclaimer suggestions
- [ ] Clean content returns status='pass'
- [ ] Both regex and LLM checks run
- [ ] All 6 test cases pass
- [ ] `npx tsc --noEmit` passes

---

### TASK-26: Ghostwriter Agent - LangGraph Implementation

**Hand to Claude Code:**

```
Implement the Ghostwriter agent as a LangGraph StateGraph.

Create file: packages/agents/ghostwriter/graph.ts

The Ghostwriter generates SEO-optimized dental content, runs it through
compliance gates, and queues it for manager approval.

State definition (GhostwriterState):
- clientId: string
- orgId: string
- runId: string
- practiceProfile: object
- topic: { keyword: string, suggestedTitle: string, angle: string, estimatedVolume: number }
- brief: ContentBrief | null
- content: { html: string, markdown: string, wordCount: number } | null
- metaTitle: string | null
- metaDescription: string | null
- seoScore: number
- complianceResult: ComplianceResult | null
- contentPieceId: string | null
- queueItemId: string | null
- rewriteAttempts: number (starts at 0, max 2)
- error: string | null

Graph nodes:

1. generate_brief:
   - Fetch top 3 ranking pages for the target keyword (use a web search or SE Ranking)
   - Use Claude Sonnet to create a detailed brief:
     suggestedTitle, h2Sections[], targetWordCount, internalLinks[], uniqueAngles[],
     practiceSpecificHooks[] (referencing doctors, services, location)
   - Include practice profile context in prompt

2. write_content:
   - Use Claude Sonnet (max_tokens: 4096)
   - System prompt emphasizes: warm professional tone, practice-specific details,
     doctor names, location references, 2-3% keyword density, 8th grade reading level,
     FAQ section with 3-4 questions, no medical advice
   - Return: html, markdown, metaTitle, metaDescription, wordCount

3. score_seo:
   - Calculate SEO score (0-100) based on:
     Primary keyword in title (+15), in first paragraph (+10), in H2 (+5)
     Keyword density 1-3% (+15), readability grade 6-10 (+10)
     Meta title length 50-70 chars (+10), meta desc 120-160 chars (+10)
     Has internal links (+10), has H2/H3 structure (+10), word count >800 (+5)
   - Store score in state.seoScore

4. check_compliance:
   - Call complianceEngine.check(html, 'dental')
   - Store result in state.complianceResult

5. handle_compliance:
   - If status='pass': continue to queue
   - If status='block' AND rewriteAttempts < 2:
     Use Claude to rewrite ONLY the flagged sections
     Increment rewriteAttempts
     Return to compliance check (loop)
   - If status='warn':
     Auto-inject disclaimers from compliance details
     Continue to queue
   - If status='block' AND rewriteAttempts >= 2:
     Still queue it but with severity='critical' so manager sees compliance issue

6. queue_for_review:
   - Create content_piece record (status: 'in_review')
   - Create agent_action record (tier: 2, status: 'pending')
   - Description: 'New blog post: "{title}" targeting "{keyword}"'
   - Store IDs in state

Graph edges:
  START → generate_brief → write_content → score_seo → check_compliance → handle_compliance
  handle_compliance → (conditional):
    if blocked and retries left → check_compliance (LOOP)
    else → queue_for_review → END

Export: createGhostwriterGraph() → compiled LangGraph
Export: runGhostwriter(clientId, orgId, topic) → Promise<GhostwriterResult>
```

**Acceptance Criteria:**
- [ ] `createGhostwriterGraph()` returns compiled graph
- [ ] Graph has 6 nodes with conditional loop for compliance
- [ ] Generated content is dental-specific using practice profile
- [ ] Compliance blocked content triggers automatic rewrite (max 2 attempts)
- [ ] Warnings get disclaimers auto-injected
- [ ] Content piece created in DB with status 'in_review'
- [ ] Agent action created in DB with status 'pending'
- [ ] SEO score calculated correctly
- [ ] `npx tsc --noEmit` passes

---

### TASK-27: Content Publishing (WordPress)

**Hand to Claude Code:**

```
Implement content publishing to WordPress via REST API.

Create file: packages/agents/integrations/wordpress.ts

Export class WordPressClient:

constructor(siteUrl: string, credentials: { username: string, applicationPassword: string })

Methods:

1. publishPost(post: WPPostInput): Promise<WPPost>
   POST /wp-json/wp/v2/posts
   Input: title, content (HTML), status ('publish'), slug, excerpt,
     meta (yoast_title, yoast_description if Yoast SEO plugin detected)
   Auth: Basic (username:applicationPassword base64 encoded)
   Returns: id, link (published URL), status

2. updatePost(postId: number, data: Partial<WPPostInput>): Promise<WPPost>
   PUT /wp-json/wp/v2/posts/{id}
   For editing published content

3. unpublishPost(postId: number): Promise<void>
   PUT post status to 'draft' — this is the ROLLBACK mechanism

4. testConnection(): Promise<boolean>
   GET /wp-json/wp/v2/users/me
   Returns true if credentials work, false otherwise

5. checkPlugins(): Promise<{ yoast: boolean, rankMath: boolean }>
   Check if Yoast SEO or Rank Math is installed (affects meta field names)

Handle errors:
- 401: throw "WordPress credentials invalid. Check application password."
- 403: throw "WordPress user doesn't have permission to publish."
- 404: throw "WordPress REST API not found. Is it enabled?"
- Network error: throw "Cannot reach WordPress site."

Create: packages/agents/integrations/wordpress.test.ts
Test with mocked HTTP responses for each method.
```

**Acceptance Criteria:**
- [ ] `publishPost()` sends correct POST request
- [ ] `unpublishPost()` sets status to 'draft' (rollback)
- [ ] `testConnection()` validates credentials
- [ ] Auth header correctly formatted as Basic base64
- [ ] Error messages are specific and helpful
- [ ] Tests pass with mocked API
- [ ] `npx tsc --noEmit` passes

---

### TASK-28: Approval → Publish Flow

**Hand to Claude Code:**

```
Implement the flow from manager approval to content deployment.

Update: app/api/queue/[id]/approve/route.ts
POST handler:
1. Manager auth required
2. Get queue item (agent_action) by ID
3. Validate status is 'pending'
4. Update status to 'approved', set approved_by and approved_at
5. If action_type is 'content_new' or 'content_edit':
   a. Get the linked content_piece
   b. Update content_piece status to 'approved'
   c. Trigger deployment (async):
      - Get client's CMS credentials
      - Call WordPressClient.publishPost()
      - Update content_piece: status='published', published_url, published_at
      - Update agent_action: status='deployed', deployed_at
      - Store WordPress post ID in rollback_data for undo
6. Return updated queue item

Update: app/api/queue/[id]/reject/route.ts
POST handler:
1. Manager auth
2. Update agent_action status to 'rejected'
3. Update linked content_piece status to 'rejected'
4. Return updated item

Update: app/api/queue/bulk-approve/route.ts
POST handler:
1. Accept { ids: string[] }
2. Loop through IDs, approve each (same logic as single approve)
3. Return { approved: number, failed: number, errors: [] }

Create: app/api/content/[id]/rollback/route.ts
POST handler:
1. Manager auth
2. Get content_piece and linked agent_action
3. Get WordPress post ID from rollback_data
4. Call WordPressClient.unpublishPost(postId)
5. Update content_piece status back to 'approved' (not published)
6. Update agent_action status to 'rolled_back'
7. Return success
```

**Acceptance Criteria:**
- [ ] Approve → content published to WordPress → status updated
- [ ] Reject → content and action marked rejected
- [ ] Bulk approve works for multiple items
- [ ] Rollback changes WordPress post to draft
- [ ] All status transitions are correct
- [ ] WordPress post ID stored for rollback
- [ ] `npx tsc --noEmit` passes

---

### TASK-29: Wire Content Editor

**Hand to Claude Code:**

```
Wire the Bolt-scaffolded content editor to real data and functionality.

Update: app/(manager)/dashboard/[client]/content/[id]/edit/page.tsx

Left Panel (Content Brief):
- Fetch content piece and its brief data from /api/content/[id]
- Display: target keyword + volume + difficulty, related keywords,
  suggested structure (H1/H2/H3), internal link suggestions,
  compliance notes

Center Panel (Editor):
- Load content body_html into a Tiptap editor (install @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link)
- Toolbar: bold, italic, headings, lists, link, undo/redo
- "Regenerate with AI" button: POST to /api/content/[id]/regenerate
  (creates new Ghostwriter run for this topic, replaces content)
- Auto-save: debounced PUT to /api/content/[id] every 30 seconds
- Word count and reading time at bottom
- Compliance badge showing current compliance_status

Right Panel (SEO Score):
- Display seo_score as gauge
- Checklist items recalculated from current editor content:
  keyword in title, keyword in first paragraph, keyword density,
  readability, meta title/description length, internal links, headings
- Each item: green check or red X
- "Compliance Warnings" section: list flagged phrases with suggestions

Meta Fields (bottom):
- Meta title input with character counter (X/70)
- Meta description input with character counter (X/160)
- Google SERP preview: blue title, green URL, gray description

Action Bar (sticky bottom):
- "Save Draft" → PUT /api/content/[id]
- "Request AI Revisions" → opens dialog to enter prompt, sends to Ghostwriter
- "Approve & Publish" → POST /api/content/[id]/publish
  Shows confirmation: "Publish to WordPress at {domain}?"

Install Tiptap: npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder
```

**Acceptance Criteria:**
- [ ] Editor loads with real content from database
- [ ] Tiptap editor is editable with toolbar working
- [ ] Auto-save fires every 30 seconds
- [ ] SEO score checklist updates as content changes
- [ ] Meta title/description inputs work with character counters
- [ ] SERP preview renders correctly
- [ ] "Approve & Publish" triggers WordPress deployment
- [ ] Compliance badge reflects current status
- [ ] `npx tsc --noEmit` passes

---

### TASK-30: Wire Approval Queue

**Hand to Claude Code:**

```
Wire the Bolt-scaffolded approval queue to real data.

Update: app/(manager)/dashboard/queue/page.tsx

1. Data fetching:
   - Fetch from /api/queue with URL-persisted filters
   - Read filters from URL search params: client, severity, type, status
   - Update URL when filters change (bookmarkable, shareable)

2. Filter bar:
   - Client dropdown: fetch clients from /api/clients, show as searchable select
   - Severity dropdown: All, Critical, Warning, Info
   - Type dropdown: All, Content, Technical, GBP, Meta
   - Active filters shown as dismissible chips
   - "Clear All" clears URL params
   - Result count shown

3. Table:
   - Use TanStack Table (@tanstack/react-table)
   - Install: npm install @tanstack/react-table
   - Columns: checkbox, client name (link), action type (badge), description (truncated),
     severity (colored dot), created (relative time), actions (approve/reject/edit buttons)
   - Row click: expand inline detail panel
   - Expanded row shows: full description, proposed changes (formatted), compliance badge,
     full approve/reject buttons

4. Bulk actions:
   - Checkbox in header for "select all visible"
   - When items selected: floating bottom bar with count + "Approve Selected" + "Reject Selected"
   - "Approve Selected" → POST /api/queue/bulk-approve
   - Show success/failure count after bulk action

5. Keyboard shortcuts:
   - j/k: navigate rows
   - a: approve focused item
   - r: reject focused item
   - x: toggle selection
   - /: focus search
   - ?: show shortcuts dialog

6. Empty state:
   - "No pending items — your clients are running smoothly"

7. Pagination: 25 per page, page controls at bottom

8. Real-time: use SWR with revalidation or Supabase realtime subscription
   to update when new items are added
```

**Acceptance Criteria:**
- [ ] Queue loads real data from database
- [ ] Filters work and persist in URL
- [ ] Filter chips are dismissible
- [ ] Table rows expand with detail panel
- [ ] Approve/reject buttons work and update status
- [ ] Bulk selection and bulk approve work
- [ ] Keyboard shortcuts work (j/k navigation, a to approve)
- [ ] Empty state renders when no items
- [ ] Pagination works
- [ ] `npx tsc --noEmit` passes

---

## PHASE 5: Local SEO (Week 7)

---

### TASK-31: GBP Integration Service

**Hand to Claude Code:**

```
Build the Google Business Profile integration service.

Create file: packages/local-seo/gbp-service.ts

Uses Google My Business API v4.9.

Export class GBPService:

constructor(tokens: DecryptedTokens)
- Initialize Google API auth with tokens

Methods:

1. getLocations(): Promise<GBPLocation[]>
   List all locations for the account
   Returns: locationId, name, address, phone, categories, websiteUrl

2. createPost(locationId: string, post: GBPPostInput): Promise<GBPPostResult>
   Create a local post on the GBP listing
   PostInput: { body, topicType ('STANDARD'|'OFFER'|'EVENT'),
     callToAction?, mediaUrl? }
   Handle image upload if mediaUrl provided

3. getReviews(locationId: string): Promise<GBPReview[]>
   List reviews: reviewer name, rating, comment, createTime, reviewReply

4. generateReviewResponse(review: GBPReview, practiceProfile: object): Promise<string>
   Use Claude Sonnet to generate a practice-specific review response:
   - Positive reviews: thank by name, mention team, warm closing
   - Negative reviews: empathy, invite to contact office directly,
     never argue or disclose health info
   - Keep under 150 words

5. getInsights(locationId: string, period: string): Promise<GBPInsights>
   Get GBP performance metrics: views, searches, actions, calls, website clicks

6. suggestCategoryOptimizations(locationId: string): Promise<CategorySuggestion[]>
   Get current categories, compare against common dental categories,
   suggest additions

Wire to API routes:
- Update app/api/gbp/[clientId]/posts/route.ts:
  GET: fetch GBP posts from DB
  POST: create GBP post via service, save to DB
- Create app/api/gbp/[clientId]/reviews/route.ts:
  GET: fetch reviews from GBP API
  POST: generate review response template
```

**Acceptance Criteria:**
- [ ] All 6 methods exported with TypeScript types
- [ ] createPost sends correct API request
- [ ] Review responses are warm and practice-specific
- [ ] Insights data returned correctly
- [ ] API routes work with proper auth
- [ ] Handles token expiration (refresh before each call)
- [ ] `npx tsc --noEmit` passes

---

### TASK-32: GBP Post Scheduler

**Hand to Claude Code:**

```
Build the GBP post scheduling system.

Create file: packages/local-seo/scheduler.ts

Export:

1. schedulePost(post: GBPPostInput & { clientId: string, scheduledAt: Date }): Promise<GBPPost>
   - Save to gbp_posts table with status='scheduled', scheduled_at
   - Return the created record

2. publishScheduledPosts(): Promise<{ published: number, failed: number }>
   - Query gbp_posts WHERE status='scheduled' AND scheduled_at <= NOW()
   - For each: get client's Google tokens, create GBP post via API
   - Update status to 'published', set published_at and gbp_post_id
   - If failed: log error, leave as 'scheduled' for retry
   - Uses supabaseAdmin (cron job, no user context)

3. generateWeeklyGBPPosts(clientId: string): Promise<GBPPostDraft[]>
   - Use Claude Sonnet to generate 2 GBP post drafts for the practice
   - Based on practice profile (services, specials, seasonal relevance)
   - Each post: title, body (150-300 words), suggested CTA type
   - Return as drafts for manager review

Create cron route: app/api/cron/publish-gbp/route.ts
- Secured with CRON_SECRET header (Vercel Cron)
- Calls publishScheduledPosts()
- Runs every 30 minutes

Also add to vercel.json:
{
  "crons": [{
    "path": "/api/cron/publish-gbp",
    "schedule": "*/30 * * * *"
  }]
}
```

**Acceptance Criteria:**
- [ ] Posts saved with scheduled status and time
- [ ] Cron publishes posts when scheduledAt has passed
- [ ] Failed publish doesn't crash the cron
- [ ] AI-generated post drafts are practice-specific
- [ ] Cron route secured with secret header
- [ ] `npx tsc --noEmit` passes

---

### TASK-33: Practice Intelligence Population

**Hand to Claude Code:**

```
Build the Practice Intelligence auto-population service.

Create file: packages/agents/practice-intelligence.ts

This service enriches a practice's profile by crawling their website
and extracting key information using Claude.

Export: populatePracticeProfile(clientId: string): Promise<PracticeProfile>

Steps:

1. Fetch the practice website homepage
   - Follow redirects, handle timeouts
   - Also fetch /about, /services, /our-team, /doctors (common dental pages)
   - Collect all text content

2. Use Claude Sonnet to extract structured data:
   Prompt: "Extract the following from this dental practice website content:
   - Practice name
   - Full address(es) with phone numbers
   - Doctor names with titles/credentials (DDS, DMD, etc.)
   - Services offered (list)
   - Specialties/focus areas
   - Insurance networks accepted (if mentioned)
   - Unique selling propositions (what makes them different)
   - Office hours (if found)
   - Any awards, certifications, or affiliations
   Return as JSON."

3. Validate NPI numbers (if doctor names found):
   - Search NPPES NPI Registry API: https://npiregistry.cms.hhs.gov/api
   - Query by name + state
   - If found: store NPI number + verified=true

4. Merge extracted data with existing practice_profile
   - Don't overwrite manually entered data
   - Only fill in gaps

5. Save updated profile to client.practice_profile

6. Create agent_action: "Practice Intelligence: auto-populated profile with
   {X} doctors, {Y} services, {Z} locations"

Wire to onboarding: after onboarding complete (TASK-18), trigger
populatePracticeProfile async in the background.

Also create API route: app/api/practice/profile/populate/route.ts
POST (manager auth): manually trigger re-population for a client
```

**Acceptance Criteria:**
- [ ] Extracts practice info from a real dental website
- [ ] Returns structured PracticeProfile with doctors, services, locations
- [ ] NPI verification queries the NPPES API
- [ ] Doesn't overwrite manually entered data
- [ ] Handles websites that block bots (returns partial data)
- [ ] Handles websites with no useful content (returns empty with message)
- [ ] `npx tsc --noEmit` passes

---

## PHASE 6: Integration + Wiring (Week 8)

---

### TASK-34: Conductor Pipeline

**Hand to Claude Code:**

```
Implement the Conductor — the master orchestrator that chains
Scholar → Ghostwriter for each client.

Create file: packages/agents/conductor/graph.ts

ConductorState:
- clientId: string
- orgId: string
- runId: string
- stage: 'init' | 'health_check' | 'scholar' | 'ghostwriter' | 'complete' | 'failed'
- scholarResult: any | null
- ghostwriterResults: any[] | null
- error: string | null

Nodes:

1. check_health:
   - Get client from DB
   - Verify account_health is 'active'
   - Test Google token refresh
   - If unhealthy: set stage='failed', error message, END
   - If healthy: continue

2. run_scholar:
   - Create scholar agent_run record
   - Invoke Scholar graph
   - Wait for completion
   - Store result in state.scholarResult

3. run_ghostwriter:
   - Take top 2 content topics from Scholar output
   - For each topic: invoke Ghostwriter graph
   - Wait for all to complete
   - Store results in state.ghostwriterResults

4. finalize:
   - Update conductor agent_run to 'completed'
   - Summary: "Researched X keywords, generated Y content pieces"

Edges:
  START → check_health → (conditional: healthy → run_scholar, unhealthy → END)
  run_scholar → run_ghostwriter → finalize → END

Export: createConductorGraph()
Export: runConductor(clientId, orgId): Promise<ConductorResult>

Create weekly cron:
- app/api/cron/weekly-pipeline/route.ts
- Secured with CRON_SECRET
- Fetches all active clients
- Runs Conductor for each (async, don't wait)
- Add to vercel.json crons: schedule "0 6 * * 1" (Monday 6 AM)

Also allow manual trigger:
- Update app/api/agents/run/route.ts to handle agent='conductor'
```

**Acceptance Criteria:**
- [ ] Conductor chains Scholar → Ghostwriter successfully
- [ ] Health check prevents pipeline for disconnected clients
- [ ] agent_run records created and updated for each stage
- [ ] Weekly cron triggers for all active clients
- [ ] Manual trigger works from manager portal
- [ ] If Scholar fails, Ghostwriter doesn't run
- [ ] `npx tsc --noEmit` passes

---

### TASK-35: Practice Dashboard Wiring

**Hand to Claude Code:**

```
Wire the Practice Dashboard to show real data.

Update: app/api/practice/dashboard/route.ts
GET handler (practice_owner auth):
1. Get client for current org
2. Fetch and aggregate:
   - Keywords: count improving, count on page 1
   - Content: count published this month, count total
   - Health score from client record
   - GSC traffic data (via stored Analyst snapshots or direct GSC call)
3. Generate "Recent Wins" from agent_actions:
   - Filter: status='deployed', last 30 days
   - Translate to plain English using packages/plain-english/translate.ts
4. Return: { kpis: {}, wins: [], trafficChart: [] }

Create: packages/plain-english/translate.ts
Export: toPlainEnglishWin(action: AgentAction): PlainEnglishWin

Translations:
- content_new (deployed): "We published '{title}' targeting a keyword {volume} people search monthly"
- keyword_research: "We found {count} new keyword opportunities for your practice"
- gbp_post: "We published a Google Business Profile update about {topic}"
- meta_update: "We improved how Google displays your {page} page"
- keyword_improvement: "Your ranking for '{keyword}' improved from #{prev} to #{current}"

Update: app/(practice)/practice/dashboard/page.tsx
- Fetch from /api/practice/dashboard using SWR
- Populate KPI cards with real data
- Render wins as timeline items
- Show traffic chart with Recharts
- Handle loading state with skeleton cards
- Handle empty state (new practice, no data yet)
```

**Acceptance Criteria:**
- [ ] Dashboard loads real data from API
- [ ] KPI cards show: traffic, rankings improving, content published, health score
- [ ] Recent wins display in plain English (not technical jargon)
- [ ] Traffic chart renders with real GSC data (or placeholder if no data yet)
- [ ] Loading skeletons show while data fetches
- [ ] Empty state for new practices with no data
- [ ] `npx tsc --noEmit` passes

---

### TASK-36: Practice Content Library + Reports Wiring

**Hand to Claude Code:**

```
Wire the Practice Content Library and Reports pages.

Update: app/api/practice/content/route.ts
GET handler:
- Fetch content_pieces for client
- Return: id, title, content_type, status, published_at, word_count,
  target_keyword, published_url
- Support filters: ?status=published&type=blog_post

Update: app/(practice)/practice/content/page.tsx
- Fetch from /api/practice/content using SWR
- Render as card grid (grid view) or table (list view)
- Toggle between grid/list
- Filter tabs: All, Published, In Progress
- Search by title
- Each card: status badge, type tag, title, preview snippet, date, keyword
- Click card → modal or page with full content preview (read-only HTML render)
- Empty state for new practices

Update: app/api/practice/reports/route.ts
GET handler:
- Fetch keyword data: position changes over time
- Fetch content performance: views per content piece (from GSC page data)
- Aggregate: total keywords improving, new page 1 keywords, content count
- Return: { metrics: {}, trafficChart: [], rankingsChart: {}, contentPerformance: [] }

Update: app/(practice)/practice/reports/page.tsx
- Fetch from /api/practice/reports using SWR
- Metrics row: People Who Found You, Rankings Improving, Content Published, Page 1 Keywords
- Charts section with tabs: Traffic (line chart), Rankings (bar chart), Content (card list)
- Traffic tab: Recharts line/area chart over 6 months
- Rankings tab: horizontal bar chart grouped by position range
  Page 1 (green), Page 2 (yellow), Page 3+ (gray)
  Plus table of top keywords with position + change + volume
- Content tab: sorted by performance (views), each showing title, date, views
- All charts use Recharts
- Handle loading + empty states
```

**Acceptance Criteria:**
- [ ] Content library shows real published content
- [ ] Grid/list toggle works
- [ ] Filter tabs filter correctly
- [ ] Search filters by title
- [ ] Reports page shows traffic, rankings, and content charts
- [ ] Rankings chart groups keywords by position range
- [ ] All data from real database queries
- [ ] Empty states for new practices
- [ ] `npx tsc --noEmit` passes

---

### TASK-37: Manager Portfolio + Client Overview Wiring

**Hand to Claude Code:**

```
Wire the Manager Portfolio Dashboard and Client Overview pages.

Update: app/api/clients/route.ts
GET handler (manager auth):
- Fetch all clients using supabaseAdmin
- For each client, include: name, domain, health_score, management_mode,
  pending_count (count of pending agent_actions), last_activity (most recent action timestamp)
- Support sorting: ?sort=health_score&order=asc
- Support filtering: ?health=critical (score < 60), ?pending=true (has pending items)

Update: app/(manager)/dashboard/page.tsx (Portfolio):
- Fetch from /api/clients using SWR
- Metrics row: Total Clients, Pending Items (sum), Average Health Score, Audit Tool Leads count
- Client grid: render real client cards
- Each card: name, domain, health score gauge, pending count badge, last activity, mode tag
- Pending badge is clickable → navigates to /dashboard/queue?client={id}
- Search bar filters by name
- Sort dropdown works

Update: app/api/clients/[id]/route.ts
GET handler (manager auth):
- Fetch single client with full data
- Include: all fields + recent agent_actions (last 10) + pending count +
  keyword summary (improving count, page 1 count) + content count

Update: app/(manager)/dashboard/[client]/page.tsx (Client Overview):
- Fetch from /api/clients/[id]
- Header: name, domain, health gauge, action buttons (Run Audit, Generate Content)
- Stats row: organic traffic, keywords ranked, content published, GBP views
- Pending Actions widget: list pending items with quick approve/reject
  "Review All →" links to /dashboard/queue?client={id}
- Activity timeline: last 10 actions with agent names and timestamps
- Tab navigation: Keywords, Content, GBP, Settings
  (Keywords wired in TASK-24, others can be placeholder tabs)

"Run Audit" button → POST /api/agents/run { agent: 'scholar', clientId }
"Generate Content" → POST /api/agents/run { agent: 'conductor', clientId }
Show loading indicator when agent is running.
```

**Acceptance Criteria:**
- [ ] Portfolio shows real client cards from database
- [ ] Metrics row shows accurate totals
- [ ] Sort and filter work
- [ ] Client Overview loads full client data
- [ ] Pending Actions widget shows real pending items
- [ ] Quick approve/reject on pending items works
- [ ] "Run Audit" and "Generate Content" trigger agents
- [ ] Activity timeline shows real agent actions
- [ ] `npx tsc --noEmit` passes

---

### TASK-38: Manager Leads Page

**Hand to Claude Code:**

```
Create a leads management page for the Manager portal.

Create: app/(manager)/dashboard/leads/page.tsx

This page shows all leads captured by the free audit tool.

Fetch from: /api/leads

Display as a table:
- Columns: Domain, Email, Score (gauge), Grade badge, Source, Converted (yes/no), Date
- Sort by: score (default desc), date, converted
- Filter: converted/not converted, minimum score, has email
- Click row: expand to show audit details (7 findings from audit_results)

Actions:
- "Send Follow-up Email" button (per lead, only if email exists)
  Opens a dialog with pre-filled email template:
  "Hi, you recently audited {domain} and scored {score}/100. We can fix these
  issues automatically. Start your free trial at zintas.ai/sign-up"
  Send via Resend

- "Export CSV" button
  Download leads as CSV: domain, email, score, grade, source, date, converted

Stats at top:
- Total leads, Leads with email, Average score, Conversion rate (if any)

Add "Leads" link to the manager sidebar nav (should already exist from TASK-03,
just make sure it links here).
```

**Acceptance Criteria:**
- [ ] Leads table shows real data from leads table
- [ ] Sort and filter work
- [ ] Row expansion shows audit details
- [ ] Follow-up email sends via Resend
- [ ] CSV export downloads correctly
- [ ] Stats show accurate aggregations
- [ ] `npx tsc --noEmit` passes

---

### TASK-39: Practice Settings / Profile Wiring

**Hand to Claude Code:**

```
Wire the Practice Settings page for viewing and editing
the practice intelligence profile.

Update: app/api/practice/profile/route.ts
GET handler:
- Fetch client's practice_profile from DB
- Return structured data: name, address, vertical, description,
  doctors[], services[], locations[], connectedAccounts (status of Google + CMS)

PUT handler:
- Accept updated profile data
- Validate with Zod (each doctor needs name + title, each location needs address)
- Merge with existing profile (don't lose data for fields not submitted)
- Save to client.practice_profile

Update: app/(practice)/practice/settings/page.tsx
Tabs:

1. Practice Profile: name, URL (read-only), vertical dropdown, description textarea, save button
2. Doctors: card list — name, title, specialization multi-select, NPI input, bio, add/remove
3. Services: checkbox grid by category (General, Cosmetic, Orthodontics, Surgical, Pediatric, Emergency), custom input, save
4. Locations: card list — address, phone, hours grid (Mon-Sun), primary radio, add/remove
5. Connected Accounts: status cards for Google (GSC, GA, GBP) and CMS
   - Show connection status: green "Connected" or orange "Disconnected"
   - "Reconnect" button → triggers OAuth flow
   - Last sync timestamp

Use react-hook-form with Zod resolver for form validation.
Save button at bottom of each tab, with success toast on save.
```

**Acceptance Criteria:**
- [ ] All 5 tabs render with correct form fields
- [ ] GET loads existing profile data into forms
- [ ] PUT saves changes correctly
- [ ] Doctors can be added/removed
- [ ] Services checkbox grid works
- [ ] Locations show hours grid
- [ ] Connected Accounts shows real status
- [ ] Form validation prevents invalid saves
- [ ] Success toast on save
- [ ] `npx tsc --noEmit` passes

---

## PHASE 7: QA + Polish (Weeks 9-10)

---

### TASK-40: Error Handling + Loading States

**Hand to Claude Code:**

```
Add proper error handling and loading states across all pages.

1. Create app/components/loading-skeleton.tsx
   Reusable skeleton components matching each page's layout:
   - DashboardSkeleton: 4 KPI card skeletons + timeline skeleton
   - TableSkeleton: filter bar skeleton + table row skeletons
   - EditorSkeleton: 3-panel skeleton

2. Create app/components/error-boundary.tsx
   React error boundary component that:
   - Catches rendering errors
   - Shows friendly error message with "Try Again" button
   - Logs error to console (and Sentry if configured)
   - Reset button re-renders children

3. Create app/components/api-error.tsx
   Component for API error states:
   - 401: "You're not signed in" with sign-in link
   - 403: "You don't have access to this page"
   - 404: "Page not found"
   - 429: "Too many requests. Please wait and try again."
   - 500: "Something went wrong. Please try again."
   - Network error: "Can't connect to server. Check your internet."

4. Update ALL page.tsx files to:
   - Show loading skeleton while data fetches (SWR isLoading)
   - Show error component if API fails
   - Handle empty state (no data yet)

5. Add toast notifications (shadcn toast):
   - Success: "Content published successfully", "Item approved"
   - Error: "Failed to approve. Please try again."
   - Info: "Agent run started. You'll see results soon."

6. Add to layout.tsx: <Toaster /> from shadcn/ui
```

**Acceptance Criteria:**
- [ ] Every page shows a skeleton while loading
- [ ] Every page shows an error state if API fails
- [ ] Every page shows an empty state if no data
- [ ] Error boundary catches rendering errors
- [ ] Toast notifications work for success/error/info
- [ ] No unhandled promise rejections in console
- [ ] `npx tsc --noEmit` passes

---

### TASK-41: End-to-End Smoke Test Script

**Hand to Claude Code:**

```
Create a comprehensive end-to-end test script that validates the
entire pilot system works together.

Create file: scripts/smoke-test.ts
Run with: npx tsx scripts/smoke-test.ts

The script should test (in order):

1. AUDIT TOOL:
   - POST /api/audit/free with a test URL
   - Verify response has score, grade, 7 findings
   - Verify lead created in database

2. ONBOARDING:
   - POST /api/onboarding/create-org (with test data)
   - Verify org created in Clerk (mock or use test instance)
   - Verify client created in Supabase
   - POST /api/onboarding/detect-cms
   - Verify CMS detection returns a result
   - POST /api/onboarding/complete
   - Verify onboarding_completed_at is set

3. SCHOLAR AGENT:
   - POST /api/agents/run with agent='scholar'
   - Wait up to 60 seconds for agent_run to complete
   - Verify keywords added to keywords table
   - Verify content topics generated

4. GHOSTWRITER AGENT:
   - POST /api/agents/run with agent='ghostwriter' and a test topic
   - Wait up to 90 seconds for completion
   - Verify content_piece created with status 'in_review'
   - Verify agent_action created with status 'pending'
   - Verify compliance_status is set

5. APPROVAL FLOW:
   - GET /api/queue — verify item appears
   - POST /api/queue/{id}/approve
   - Verify agent_action status = 'deployed'
   - Verify content_piece status = 'published'

6. PRACTICE DASHBOARD:
   - GET /api/practice/dashboard
   - Verify KPIs have values
   - Verify wins array is not empty

7. CLEANUP:
   - Delete test data from all tables
   - Delete test Clerk org

Log results:
✅ PASS or ❌ FAIL for each test
Total: X/7 passed

Exit code: 0 if all pass, 1 if any fail

Use environment variables for API URLs and auth tokens.
Add a --skip-agents flag to skip slow agent tests.
```

**Acceptance Criteria:**
- [ ] Script runs without manual intervention
- [ ] All 7 test suites have pass/fail output
- [ ] Test data is cleaned up after run
- [ ] Script exits with appropriate code
- [ ] Can skip slow tests with --skip-agents flag
- [ ] Clear error messages on failure with context

---

### TASK-42: Production Deployment Config

**Hand to Claude Code:**

```
Create all configuration needed for production deployment.

1. Create vercel.json:
   - Cron jobs: weekly-pipeline (Monday 6AM), publish-gbp (every 30 min)
   - Headers: security headers (X-Content-Type-Options, X-Frame-Options, etc.)
   - Redirects: /pricing → /#pricing (if pricing is on homepage)

2. Create .github/workflows/ci.yml:
   GitHub Actions CI pipeline:
   - Trigger: push to main, pull requests
   - Steps: checkout, setup Node 20, install deps, lint (eslint), typecheck (tsc),
     run unit tests (vitest), build (next build)
   - Deploy to Vercel on push to main (using Vercel CLI)

3. Create .github/workflows/deploy.yml:
   Production deployment:
   - Trigger: push to main
   - Steps: build, deploy to Vercel production
   - Run Supabase migrations
   - Set environment variables

4. Update next.config.js:
   - Enable server actions
   - Set images domains for practice websites
   - Security headers
   - Redirect /sign-in and /sign-up to Clerk paths

5. Create scripts/setup-production.sh:
   Checklist script that verifies:
   - All environment variables are set
   - Supabase connection works
   - Clerk is configured with correct roles
   - Google OAuth credentials are set
   - SE Ranking API key works
   - Redis connection works
   - Resend API key works
   Print: ✅ Ready for production or ❌ Missing: [list]

6. Create DEPLOYMENT.md:
   Step-by-step deployment guide:
   - Prerequisites (accounts needed)
   - Environment variable setup
   - Database migration
   - Clerk configuration (roles, OAuth)
   - Google Cloud Console setup (OAuth consent screen, API enablement)
   - Domain configuration
   - First deployment
   - Verifying everything works
```

**Acceptance Criteria:**
- [ ] vercel.json has cron jobs configured
- [ ] CI pipeline lints, typechecks, tests, and builds
- [ ] Deploy pipeline publishes to Vercel
- [ ] setup-production.sh checks all dependencies
- [ ] DEPLOYMENT.md is comprehensive and followable
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds

---

## Task Dependency Graph

```
TASK-01 (Init)
  ├── TASK-02 (Schema) → TASK-04 (Queries) → TASK-05 (API Routes)
  ├── TASK-03 (Auth) → TASK-05
  ├── TASK-06 (Encryption)
  ├── TASK-07 (Rate Limiting)
  └── TASK-08 (Shared UI)

TASK-05 + TASK-09 (Audit Engine) → TASK-10 (Audit API) → TASK-13 (Wire Audit Page)
TASK-08 + TASK-11 (ROI Calculator) → TASK-12 (Wire Homepage)

TASK-06 → TASK-14 (Google OAuth) → TASK-19 (Wire Onboarding)
TASK-15 (CMS Detect) → TASK-16 (Org Creation) → TASK-17 (Competitors) → TASK-18 (Complete) → TASK-19

TASK-20 (SE Ranking Client) → TASK-22 (Scholar Graph)
TASK-21 (GSC Client) → TASK-22
TASK-22 → TASK-23 (Scholar API) → TASK-24 (Wire Keywords)

TASK-25 (Compliance Engine) → TASK-26 (Ghostwriter Graph)
TASK-26 + TASK-27 (WordPress Client) → TASK-28 (Approve→Publish)
TASK-28 → TASK-29 (Wire Editor) + TASK-30 (Wire Queue)

TASK-31 (GBP Service) → TASK-32 (GBP Scheduler)
TASK-33 (Practice Intelligence) — can run in parallel

TASK-34 (Conductor) depends on TASK-22 + TASK-26
TASK-35 (Practice Dashboard) depends on TASK-24 + TASK-28
TASK-36 (Content + Reports) depends on TASK-28
TASK-37 (Manager Portfolio) depends on TASK-28
TASK-38 (Leads Page) depends on TASK-10
TASK-39 (Settings) depends on TASK-33

TASK-40 (Error Handling) — after all pages wired
TASK-41 (Smoke Test) — after all features complete
TASK-42 (Deploy Config) — final task
```

---

## Quick Reference: What Bolt Does vs. Claude Code

| Bolt (Week 2 only) | Claude Code (Weeks 1, 3-10) |
|---|---|
| Generate 11 screen layouts | Wire screens to real data |
| Static mock data | API routes + database queries |
| Visual components | Auth, RBAC, middleware |
| Layout + styling | LangGraph agents |
| — | Compliance engine |
| — | Google OAuth + APIs |
| — | SE Ranking integration |
| — | WordPress publishing |
| — | GBP integration |
| — | Free audit engine |
| — | Email templates |
| — | Cron jobs |
| — | Error handling |
| — | Testing + deployment |

**Bolt: 1 week, 11 screens.**
**Claude Code: 9 weeks, 42 tasks, the entire brain.**
