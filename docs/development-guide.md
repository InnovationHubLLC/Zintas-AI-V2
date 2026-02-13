# Zintas AI - Development Guide

Practical guide for developers working on Zintas AI Pilot (v2).

---

## 1. Prerequisites

### Required Software
- **Node.js 20+** (LTS recommended)
- **npm** (comes with Node.js)
- **Git**
- **A code editor** (VS Code recommended)

### Required Accounts (for local development)
Minimum setup to run locally:
- **Clerk** (authentication) — [clerk.com](https://clerk.com)
- **Supabase** (database + RLS) — [supabase.com](https://supabase.com)
- **Anthropic** (Claude API for AI agents) — [console.anthropic.com](https://console.anthropic.com)

### Optional Accounts (features will be disabled without these)
- **SE Ranking** — keyword research + competitor analysis
- **Google Cloud** — OAuth, Places API, PageSpeed API
- **Resend** — transactional email
- **Upstash** — Redis for rate limiting

---

## 2. Local Setup

### Step-by-Step Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/zintas-ai-v2.git
cd zintas-ai-v2
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env.local
```

4. **Fill in minimum required env vars**

Open `.env.local` and fill these **required** values:
```bash
# Clerk (authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Anthropic (AI agents)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Optional** values (features will gracefully degrade without these):
```bash
SE_RANKING_API_KEY=          # Keyword research disabled
UPSTASH_REDIS_REST_URL=      # Rate limiting disabled (dev mode allows all)
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=              # Email sending disabled
RECAPTCHA_SECRET_KEY=        # Captcha auto-passes in dev mode
```

5. **Start the dev server**
```bash
npm run dev
```

6. **Verify it works**
- Open http://localhost:3000
- You should see the landing page
- Navigate to `/sign-up` to create a test account

---

## 3. Project Structure

```
E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\
│
├── app/                          # Next.js 14 app directory
│   ├── (manager)/               # Route group: Manager dashboard
│   │   └── dashboard/           # Manager UI for multi-client management
│   ├── (onboarding)/            # Route group: New user onboarding flow
│   ├── (practice)/              # Route group: Single practice owner views
│   │   └── dashboard/           # Practice owner UI (single client)
│   ├── api/                     # Next.js API routes
│   │   ├── agents/              # Agent execution endpoints
│   │   ├── audit/free/          # Public free audit
│   │   ├── clients/             # Client CRUD (manager)
│   │   ├── compliance/          # HIPAA compliance checker
│   │   ├── content/             # Content management + publishing
│   │   ├── cron/                # Scheduled jobs (Vercel cron)
│   │   ├── gbp/                 # Google Business Profile posts
│   │   ├── keywords/            # Keyword research
│   │   ├── leads/               # Free audit lead capture
│   │   ├── onboarding/          # Onboarding API routes
│   │   ├── practice/            # Practice-specific routes
│   │   └── queue/               # Approval queue
│   ├── audit/                   # Public free audit page
│   ├── components/              # Shared UI components
│   ├── sign-in/                 # Clerk sign-in page
│   ├── sign-up/                 # Clerk sign-up page
│   ├── globals.css              # Global Tailwind styles
│   ├── layout.tsx               # Root layout (fonts, providers)
│   └── page.tsx                 # Landing page
│
├── packages/                    # Monorepo-style shared packages
│   ├── agents/                  # LangGraph AI agents (Scholar, Ghostwriter, Conductor, Analyst)
│   ├── audit-engine/            # Free audit logic (7 checks)
│   ├── compliance/              # HIPAA compliance rules engine
│   ├── db/                      # Supabase client + queries + types
│   ├── local-seo/               # Local SEO utilities (schema markup, NAP consistency)
│   └── plain-english/           # Plain English rewriter (LLM-based simplification)
│
├── lib/                         # Utility functions + helpers
│   ├── auth-helpers.ts          # requireAuth, requireRole, requireAgentKey
│   ├── rate-limit-middleware.ts # Upstash rate limiter
│   └── utils.ts                 # cn() for Tailwind class merging
│
├── __tests__/                   # Test files (39 total, 1884 tests)
│   └── task-*.test.ts           # Feature-based test suites
│
├── scripts/                     # Utility scripts
│   ├── smoke-test.ts            # Full E2E smoke test
│   └── setup-production.sh      # Production readiness verification
│
├── .github/workflows/           # CI/CD pipelines
│   ├── ci.yml                   # Lint → TypeCheck → Test → Build
│   └── deploy.yml               # Deploy to Vercel (main branch only)
│
├── middleware.ts                # Clerk auth + role-based redirects
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind theme + colors
├── tsconfig.json                # TypeScript config (strict mode, path aliases)
├── vitest.config.ts             # Vitest test runner config
├── package.json                 # Dependencies + scripts
└── .env.example                 # Environment variable template
```

---

## 4. Code Conventions

Based on actual codebase patterns:

### TypeScript
- **Strict mode enabled** (`tsconfig.json` has `strict: true`)
- **No `any` types** — use `unknown` with type guards or explicit types
- **Explicit return types** on all functions
- **Interfaces** for object shapes, **Types** for unions/primitives

```typescript
// Good
interface Client {
  id: string
  name: string
}

type Status = 'pending' | 'approved' | 'rejected'

async function getClient(id: string): Promise<Client | null> {
  // ...
}

// Bad
function getClient(id: any): any {
  // ...
}
```

### File Naming
- **Files**: `kebab-case.ts` (e.g., `auth-helpers.ts`, `rate-limit-middleware.ts`)
- **Components**: `kebab-case.tsx` (e.g., `health-score-gauge.tsx`)
- **Routes**: `route.ts` (Next.js convention)

### Naming Conventions
- **Functions/variables**: `camelCase` (e.g., `getClientById`, `userId`)
- **Types/Interfaces**: `PascalCase` (e.g., `Client`, `CreateClientInput`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_BASE_URL`)

### Import Order
```typescript
// 1. External packages
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'

// 2. Internal packages (@packages/*)
import { createClient } from '@packages/db/queries'
import { runAudit } from '@packages/audit-engine'

// 3. Internal absolute imports (@/*)
import { requireAuth } from '@/lib/auth-helpers'

// 4. Relative imports
import { calculateScore } from './utils'
```

### Error Handling
Always use try/catch with structured errors:

```typescript
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await requireAuth()
    const data = await fetchData(userId)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Async/Await
- Use `async/await`, **not** `.then()` chains
- Always handle errors with try/catch

### Early Returns
Reduce nesting with early returns:

```typescript
// Good
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const client = await getClientById(clientId)
if (!client) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// ... rest of logic

// Bad
if (userId) {
  const client = await getClientById(clientId)
  if (client) {
    // ... deeply nested logic
  }
}
```

### Exports
- **Named exports** for utilities and components
- **Default exports** only for `page.tsx` and `layout.tsx` (Next.js requirement)

---

## 5. Testing

### Framework
**Vitest** with **jsdom** for React component testing.

### Commands
```bash
npm test                  # Run all tests once
npm run test:watch        # Watch mode (re-run on file changes)
npm run test:coverage     # Generate coverage report
```

### Test Statistics
- **39 test files**
- **1884 total tests**
- Target coverage: **Services 90%, Routes 70%, Overall 80%**

### Test File Naming
Pattern: `__tests__/task-XX-description.test.ts`

Examples:
- `__tests__/task-05-api-routes.test.ts`
- `__tests__/task-09-audit-engine.test.ts`

### Test Structure (Arrange/Act/Assert)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('ServiceName', () => {
  describe('methodName', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should return client when ID exists', async () => {
      // Arrange
      const mockClient = { id: '123', name: 'Test Client' }
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null })
          })
        })
      })

      // Act
      const result = await getClientById('123')

      // Assert
      expect(result).toEqual(mockClient)
    })

    it('should throw when database query fails', async () => {
      // Arrange
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
          })
        })
      })

      // Act & Assert
      await expect(getClientById('123')).rejects.toThrow('Failed to get client')
    })
  })
})
```

### Mocking Patterns

#### Mock Supabase
```typescript
vi.mock('@packages/db/client', () => ({
  supabaseServer: vi.fn(() => mockSupabase),
  supabaseAdmin: mockSupabaseAdmin,
}))
```

#### Mock Clerk auth()
```typescript
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({
    userId: 'user_123',
    orgId: 'org_456',
    orgRole: 'org:manager',
  })),
}))
```

#### Mock fetch
```typescript
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

mockFetch.mockResolvedValue(
  new Response(JSON.stringify({ data: 'test' }), { status: 200 })
)
```

### Coverage Targets
- **Services**: 90% (business logic must be thoroughly tested)
- **Routes**: 70% (test happy path + error cases)
- **Overall**: 80%

---

## 6. Adding New Features

### Adding a New API Route

**Location**: `app/api/[feature]/route.ts`

**Template** (based on actual route patterns):

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'

// Define input schema
const InputSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate + authorize
    const { userId, orgId } = await requireRole('org:manager')

    // 2. Validate input
    const body = InputSchema.parse(await request.json())

    // 3. Business logic
    const result = await yourServiceFunction(body)

    // 4. Return response
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    // 5. Handle errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Auth patterns**:
- **Public route**: No auth helper needed
- **Authenticated route**: `await requireAuth()`
- **Role-based route**: `await requireRole('org:manager')` or `requireRole('org:practice_owner')`
- **Agent-to-agent**: `requireAgentKey(request)`

**Rate limiting** (for expensive operations):
```typescript
import { rateLimiter, checkRateLimit } from '@packages/db/rate-limit'

const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1'
const rateLimitResult = await checkRateLimit(rateLimiter, ip)
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

---

### Adding a New Page

**Route group selection**:
- `app/(manager)/` — For agency managers (multi-client view)
- `app/(practice)/` — For practice owners (single-client view)
- `app/(onboarding)/` — For new user onboarding flow
- `app/` — For public pages (landing, audit, pricing)

**Template**:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/app/components/loading-skeleton'
import { ApiError } from '@/app/components/api-error'

interface Data {
  // your shape
}

export default function MyPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/your-endpoint')
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Skeleton />
  if (error) return <ApiError message={error} />

  return (
    <div>
      {/* your UI */}
    </div>
  )
}
```

**Important**:
- Use `'use client'` for interactive pages
- Use existing components: `Skeleton`, `ApiError`, `EmptyState`, etc.
- Data fetching: `useEffect + fetch` to API route (NOT direct DB calls)

---

### Adding a New Database Table

1. **Create SQL migration** in `supabase/migrations/`

```sql
-- supabase/migrations/20260212_add_reports.sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES clients(org_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see reports for their org
CREATE POLICY "Users can view own org reports"
  ON reports FOR SELECT
  USING (org_id = current_setting('request.jwt.claims', true)::json->>'org_id');

-- Policy: Managers can insert reports
CREATE POLICY "Managers can create reports"
  ON reports FOR INSERT
  WITH CHECK (org_id = current_setting('request.jwt.claims', true)::json->>'org_id');
```

2. **Add TypeScript types** in `packages/db/types.ts`

```typescript
export interface Report {
  id: string
  org_id: string
  title: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateReportInput {
  org_id: string
  title: string
  data: Record<string, unknown>
}
```

3. **Create query module** in `packages/db/queries/reports.ts`

```typescript
import type { Report, CreateReportInput } from '@packages/db/types'
import { supabaseServer } from '@packages/db/client'

export async function getReportById(reportId: string): Promise<Report | null> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Failed to get report: ${error.message}`)
  }

  return data as Report
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const supabase = supabaseServer()
  const { data, error } = await supabase
    .from('reports')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`)
  }

  return data as Report
}
```

4. **Export from index** in `packages/db/index.ts`

```typescript
export * from './queries/reports'
```

---

### Adding a New Agent

Agents use **LangGraph** (LangChain's state machine framework).

**Steps**:

1. **Create state annotation** in `packages/agents/[agent-name]/state.ts`

```typescript
import { Annotation } from '@langchain/langgraph'

export const AgentState = Annotation.Root({
  clientId: Annotation<string>,
  input: Annotation<string>,
  output: Annotation<string | null>,
  error: Annotation<string | null>,
})

export type AgentStateType = typeof AgentState.State
```

2. **Implement node functions** in `packages/agents/[agent-name]/nodes.ts`

```typescript
import type { AgentStateType } from './state'

export async function processNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  // Your logic here
  return { output: 'Processed result' }
}
```

3. **Build graph** in `packages/agents/[agent-name]/graph.ts`

```typescript
import { StateGraph } from '@langchain/langgraph'
import { AgentState } from './state'
import { processNode } from './nodes'

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode('process', processNode)
    .addEdge('__start__', 'process')
    .addEdge('process', '__end__')

  return graph.compile()
}
```

4. **Create API route** in `app/api/agents/[agent-name]/run/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAgentKey } from '@/lib/auth-helpers'
import { buildGraph } from '@packages/agents/[agent-name]/graph'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAgentKey(request)
    const { clientId, input } = await request.json()

    const graph = buildGraph()
    const result = await graph.invoke({ clientId, input })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 })
  }
}
```

5. **Write tests** in `packages/agents/[agent-name]/[agent-name].test.ts`

---

## 7. CI/CD Pipeline

### Workflow: `ci.yml` (runs on push + PRs to main)

**Stages**:
1. Lint (`npm run lint`)
2. Type check (`npx tsc --noEmit`)
3. Unit tests (`npm test`)
4. Build (`npm run build`)

**Triggered on**:
- Push to `main`
- Pull requests to `main`

### Workflow: `deploy.yml` (runs on push to main only)

**Stages**:
1. Install dependencies
2. Pull Vercel environment
3. Build with Vercel CLI
4. Deploy to production

**Required GitHub Secrets**:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY
```

### Pre-Merge Checklist
Before merging a PR:
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Manual smoke test on localhost
- [ ] Code reviewed by at least one other developer

---

## 8. Debugging

### Smoke Tests

**Full E2E smoke test** (all features + agents):
```bash
npm run smoke-test
```

**Quick smoke test** (skip slow agent tests):
```bash
npm run smoke-test:quick
```

What it tests:
- Database connectivity (Supabase)
- Authentication (Clerk)
- Agent execution (LangGraph + Anthropic)
- Rate limiting (Upstash)
- Email sending (Resend)

### Production Readiness Check

Run before deploying to production:
```bash
bash scripts/setup-production.sh
```

This script:
- Validates all required env vars are set
- Tests connectivity to Supabase, Upstash Redis
- Confirms service health
- Exits with code 1 if any checks fail

### Vercel Function Logs

**For monitoring cron jobs**:
1. Go to Vercel dashboard
2. Select project
3. Navigate to "Functions" tab
4. Click on a function (e.g., `/api/cron/weekly-pipeline`)
5. View execution logs + errors

### Supabase Dashboard

**For data inspection**:
1. Open Supabase project dashboard
2. Navigate to "Table Editor"
3. Query tables directly (useful for debugging RLS issues)
4. Check "Logs" for SQL errors

### Browser DevTools

**For API debugging**:
1. Open DevTools (F12)
2. Network tab
3. Filter by "Fetch/XHR"
4. Inspect request/response for failed API calls
5. Check "Console" for client-side errors

---

## 9. Environment Variables Reference

Full reference (all 17+ variables from `.env.example`):

| Variable | Required | Description | Where to Get It |
|----------|----------|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Sign-in redirect | Always `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Sign-up redirect | Always `/sign-up` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) | Supabase Dashboard → Settings → API |
| `ANTHROPIC_API_KEY` | Yes | Claude API key | console.anthropic.com → API Keys |
| `SE_RANKING_API_KEY` | No | SE Ranking API key | SE Ranking Dashboard → API |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret | Google Cloud Console → Credentials |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL | Set to `{APP_URL}/api/onboarding/google-oauth/callback` |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL | Upstash Console → Database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token | Upstash Console → Database → REST API |
| `RESEND_API_KEY` | No | Resend API key | resend.com → API Keys |
| `RECAPTCHA_SECRET_KEY` | No | Google reCAPTCHA secret | Google reCAPTCHA Admin |
| `ENCRYPTION_KEY` | No | Encryption key for tokens | Generate with `openssl rand -hex 32` |
| `AGENT_API_KEY` | No | Agent-to-agent auth key | Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | No | Your app's public URL | `http://localhost:3000` (dev) or `https://zintas.ai` (prod) |

---

## 10. Known Gotchas

### 1. Clerk orgRole is null on first request after org creation

**Problem**: When a user creates an organization, `orgRole` may be `null` on the first request.

**Solution**: Use Clerk webhooks (`afterAuth`) or poll until `orgRole` is populated.

```typescript
const { userId, orgId, orgRole } = await auth.protect()

if (!orgRole) {
  // Redirect to waiting page or poll again
  return NextResponse.redirect(new URL('/onboarding/waiting', request.url))
}
```

---

### 2. Supabase RLS blocks agent writes

**Problem**: Agents run without user context, so RLS policies block writes.

**Solution**: Use `supabaseAdmin` (bypasses RLS) for agent operations.

```typescript
import { supabaseAdmin } from '@packages/db/client'

// Agent code
const { error } = await supabaseAdmin
  .from('content')
  .insert({ org_id: clientOrgId, ... })
```

---

### 3. SE Ranking rate limits during bulk research

**Problem**: SE Ranking API has strict rate limits (e.g., 10 requests/minute).

**Solution**: Add 500ms delay between batches.

```typescript
for (const batch of batches) {
  await Promise.all(batch.map(fetchKeywordData))
  await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
}
```

---

### 4. Google OAuth tokens expire after 1 hour

**Problem**: Google access tokens expire after 60 minutes.

**Solution**: Always call `refreshTokenIfNeeded()` before using tokens.

```typescript
async function refreshTokenIfNeeded(client: Client): Promise<string> {
  if (!client.google_access_token_expires_at) return client.google_access_token
  if (new Date(client.google_access_token_expires_at) > new Date()) {
    return client.google_access_token
  }
  // Refresh logic...
}
```

---

### 5. WordPress REST API 401 on some hosts

**Problem**: Some WordPress hosts disable Basic Auth by default.

**Solution**: Use Application Passwords (WordPress 5.6+) instead of Basic Auth.

```typescript
const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
  headers: {
    'Authorization': `Basic ${Buffer.from(`user:${appPassword}`).toString('base64')}`
  }
})
```

---

### 6. Compliance regex can match inside HTML tags

**Problem**: Regex like `/guaranteed/i` matches `<div class="guaranteed">`.

**Solution**: Strip HTML before compliance checks.

```typescript
import { stripHtml } from '@packages/compliance/utils'

const plainText = stripHtml(content)
const violations = checkCompliance(plainText)
```

---

### 7. Free audit fetch() fails on bot-protected sites

**Problem**: Sites with Cloudflare bot protection return 403/503 for fetch().

**Solution**: Handle gracefully with partial scoring.

```typescript
try {
  const response = await fetch(url)
  if (!response.ok) {
    return { score: 0, status: 'warning', finding: 'Could not fetch page (bot protection?)' }
  }
} catch (error) {
  return { score: 0, status: 'fail', finding: 'Site unreachable' }
}
```

---

### 8. LangGraph checkpoint data must be JSON-serializable

**Problem**: LangGraph state cannot contain `Date` objects or functions.

**Solution**: Use ISO strings for dates.

```typescript
// Bad
export const AgentState = Annotation.Root({
  createdAt: Annotation<Date>, // ❌ Not JSON-serializable
})

// Good
export const AgentState = Annotation.Root({
  createdAt: Annotation<string>, // ✅ Use ISO string
})
```

---

### 9. Vercel cron jobs need CRON_SECRET

**Problem**: Cron routes are publicly accessible without auth.

**Solution**: Set `CRON_SECRET` in Vercel dashboard and verify in route.

```typescript
const secret = request.headers.get('authorization')?.replace('Bearer ', '')
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 10. Rate limiter needs Upstash Redis

**Problem**: Local dev without Upstash Redis will throw errors.

**Solution**: Gracefully disable rate limiting in dev mode.

```typescript
export async function checkRateLimit(limiter: Ratelimit, identifier: string) {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // Dev mode: allow all requests
    return { success: true, remaining: 999, reset: Date.now() }
  }
  return limiter.limit(identifier)
}
```

---

## Summary

You now have everything you need to:
- Set up a local development environment
- Understand the codebase structure
- Follow code conventions
- Write and run tests
- Add new features (API routes, pages, DB tables, agents)
- Debug issues
- Deploy with CI/CD

For questions, check the BRD (`Zintas-Pilot-Build-BRD.docx`) or Playbook (`zintas-pilot-build-playbook.md`).

Happy coding!
