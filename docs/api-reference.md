# Zintas AI - API Reference

Version 1.0.0

---

## Table of Contents

1. [Conventions](#conventions)
2. [Public Routes](#public-routes)
3. [Practice Owner Routes](#practice-owner-routes)
4. [Manager Routes](#manager-routes)
5. [Agent Routes](#agent-routes)
6. [Onboarding Routes](#onboarding-routes)
7. [Cron Routes](#cron-routes)
8. [Error Codes](#error-codes)

---

## Conventions

### Base URL

All API routes are prefixed with `/api/`.

```
https://zintas.ai/api/
```

### Authentication

Authentication is handled automatically by the Clerk Next.js middleware. Routes requiring authentication use `requireAuth()` or `requireRole()` helper functions.

| Auth Type | Description | Header |
|-----------|-------------|--------|
| Clerk JWT | Auto-attached by @clerk/nextjs middleware | Automatic (Cookie/Header) |
| Agent API Key | Agent-to-agent internal communication | `x-agent-api-key: <AGENT_API_KEY>` |
| Cron Secret | Vercel Cron jobs | `Authorization: Bearer <CRON_SECRET>` |

### Role Enforcement

| Role | Description |
|------|-------------|
| `requireAuth()` | Any authenticated user |
| `requireRole('org:practice_owner')` | Practice owner only |
| `requireRole('org:manager')` | Zintas AI manager only |
| `requireAgentKey()` | Agent API key required |

### Response Format

All successful responses return JSON:

```json
{
  "key": "value"
}
```

### Error Format

All error responses use this format:

```json
{
  "error": "Error message",
  "details": [...]  // Optional, included for validation errors
}
```

### Rate Limiting

Rate-limited routes return these headers:

```
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1672531200
```

Rate limits:
- Audit (public): 3 requests / hour per IP
- API (authenticated): 100 requests / minute per user
- Agent: 10 requests / minute per client
- Email: 10 requests / hour per user
- Email per lead: 1 request / 24 hours per lead

---

## Public Routes

### POST /api/audit/free

Run a free SEO audit for a dental practice website.

**Auth:** None (public)

**Rate Limit:** 3 requests / hour per IP

**Request Body:**

```typescript
{
  url: string;           // URL to audit (must be valid URL)
  email?: string;        // Optional email for full results
  recaptchaToken: string; // reCAPTCHA v3 token
}
```

**Response (201):**

```typescript
{
  id: string;            // Lead UUID
  score: number;         // 0-100
  grade: string;         // A+, A, B+, B, C+, C, D, F
  findings: Array<{
    category: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    recommendation?: string;  // Only included if email provided
  }>;
}
```

**Side Effects:**
- Creates a lead in database
- Sends email with full recommendations if email provided (async)
- Stores IP hash for rate limiting

**Errors:**
- `400` - Validation failed (invalid URL, missing reCAPTCHA)
- `429` - Rate limit exceeded (3/hour)
- `500` - Audit engine failed

---

### GET /api/audit/free/[id]

Retrieve audit results by ID.

**Auth:** None (public)

**Response (200):**

```typescript
{
  id: string;
  domain: string;
  score: number;
  grade?: string;
  findings: Array<{
    category: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    recommendation?: string;  // Only included if email was provided during audit
  }>;
  createdAt: string;  // ISO 8601
}
```

**Errors:**
- `404` - Audit not found
- `500` - Database error

---

## Practice Owner Routes

All routes require `requireRole('org:practice_owner')`.

### GET /api/practice/dashboard

Get practice dashboard overview with KPIs, recent wins, and traffic data.

**Auth:** `org:practice_owner`

**Response (200):**

```typescript
{
  client: {
    name: string;
    domain: string;
  };
  kpis: {
    healthScore: number;
    keywordCount: number;
    keywordsRanked: number;
    rankingsImproving: number;
    page1: number;
    contentPublished: number;
    contentThisMonth: number;
    pendingActions: number;
  };
  wins: Array<{
    date: string;
    title: string;
    impact: string;
    agent: string;
  }>;
  trafficChart: Array<{
    date: string;
    visitors: number;
  }>;
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Practice not found
- `500` - Database error

---

### GET /api/practice/content

Get all content pieces for the practice.

**Auth:** `org:practice_owner`

**Query Parameters:**

```
?status=draft|in_review|approved|published|rejected
?type=blog_post|service_page|faq|gbp_post
```

**Response (200):**

```typescript
Array<{
  id: string;
  client_id: string;
  title: string;
  content_type: string;
  status: string;
  target_keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  word_count: number;
  created_at: string;
  published_at: string | null;
  published_url: string | null;
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Practice not found
- `500` - Database error

---

### GET /api/practice/content/[id]

Get a single content piece by ID.

**Auth:** `org:practice_owner`

**Response (200):**

```typescript
{
  id: string;
  client_id: string;
  title: string;
  content_type: string;
  body_html: string | null;
  body_markdown: string | null;
  status: string;
  target_keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  word_count: number;
  created_at: string;
  published_at: string | null;
  published_url: string | null;
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Content not found
- `500` - Database error

---

### GET /api/practice/reports

Get detailed reports: traffic, rankings, keyword trends, content performance.

**Auth:** `org:practice_owner`

**Response (200):**

```typescript
{
  metrics: {
    totalKeywords: number;
    rankingsImproving: number;
    page1: number;
    contentPublished: number;
    totalContent: number;
  };
  trafficChart: Array<{
    date: string;
    visitors: number;
  }>;
  rankingsChart: Array<{
    range: string;
    count: number;
    color: string;
  }>;
  keywordTrends: Array<{
    keyword: string;
    current_position: number | null;
    previous_position: number | null;
    change: number | null;
    search_volume: number;
  }>;
  contentPerformance: Array<{
    id: string;
    title: string;
    content_type: string;
    published_at: string | null;
    target_keyword: string | null;
    word_count: number;
  }>;
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Practice not found
- `500` - Database error

---

### GET /api/practice/profile

Get practice profile with connected accounts.

**Auth:** `org:practice_owner`

**Response (200):**

```typescript
{
  id: string;
  name: string;
  domain: string;
  vertical: string;
  description: string;
  doctors: Array<{
    name: string;
    title: string;
    specialization?: string[];
    npi?: string;
    bio?: string;
  }>;
  services: string[];
  locations: Array<{
    address: string;
    phone?: string;
    hours?: Record<string, string>;
    primary?: boolean;
  }>;
  connectedAccounts: {
    google: {
      gsc: boolean;
      ga: boolean;
      gbp: boolean;
      lastSync: string | null;
    };
    cms: {
      connected: boolean;
      type: string | null;
      lastSync: string | null;
    };
  };
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Practice not found
- `500` - Database error

---

### PUT /api/practice/profile

Update practice profile.

**Auth:** `org:practice_owner`

**Request Body:**

```typescript
{
  name?: string;
  vertical?: string;
  description?: string;
  doctors?: Array<{
    name: string;
    title: string;
    specialization?: string[];
    npi?: string;
    bio?: string;
  }>;
  services?: string[];
  locations?: Array<{
    address: string;
    phone?: string;
    hours?: Record<string, string>;
    primary?: boolean;
  }>;
}
```

**Response (200):**

```typescript
{
  // Updated client object (all fields)
}
```

**Side Effects:**
- Updates client record in database
- Merges partial updates with existing profile data

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a practice owner
- `404` - Practice not found
- `500` - Database error

---

### POST /api/practice/profile/populate

Populate practice profile using AI (manager only, despite being under /practice).

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
}
```

**Response (200):**

```typescript
{
  // Populated practice profile object
}
```

**Side Effects:**
- Runs practice-intelligence agent to scrape and populate profile data
- Updates client.practice_profile

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Agent execution failed

---

## Manager Routes

All routes require `requireRole('org:manager')`.

### GET /api/clients

Get all clients (cross-org, manager view).

**Auth:** `org:manager`

**Response (200):**

```typescript
Array<{
  // All client fields
  pending_count: number;       // Derived
  last_activity: string | null; // Derived from agent_actions
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/clients

Create a new client.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  name: string;
  domain: string;  // Must be valid URL
}
```

**Response (201):**

```typescript
{
  id: string;
  org_id: string;
  name: string;
  domain: string;
  management_mode: 'managed';
  vertical: 'dental';
  health_score: 0;
  created_at: string;
  // ... other client fields
}
```

**Side Effects:**
- Creates client in database
- Sets default values for new client

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### GET /api/clients/[id]

Get detailed client information with stats.

**Auth:** `org:manager`

**Response (200):**

```typescript
{
  client: {
    // All client fields
  };
  recent_actions: Array<AgentAction>;  // Last 10
  pending_count: number;
  keyword_summary: {
    total: number;
    improving_count: number;
    page_1_count: number;
  };
  content_count: number;  // Published only
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Client not found
- `500` - Database error

---

### PUT /api/clients/[id]

Update client details.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  name?: string;
  domain?: string;  // Must be valid URL
  management_mode?: 'managed' | 'self_service';
  practice_profile?: Record<string, unknown>;
}
```

**Response (200):**

```typescript
{
  // Updated client object
}
```

**Side Effects:**
- Updates client record in database

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### GET /api/queue

Get agent action queue items.

**Auth:** `org:manager`

**Query Parameters:**

```
?clientId=uuid
?status=pending|approved|deployed|rejected|rolled_back
?severity=critical|high|medium|low
?actionType=content_new|content_edit|keyword_add|etc
?limit=50
?offset=0
```

**Response (200):**

```typescript
Array<{
  id: string;
  client_id: string;
  action_type: string;
  status: string;
  severity: string;
  title: string;
  description: string;
  content_piece_id: string | null;
  created_at: string;
  approved_at: string | null;
  deployed_at: string | null;
  // ... other fields
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/queue/[id]/approve

Approve a pending queue item.

**Auth:** `org:manager`

**Response (200):**

```typescript
{
  // Updated queue item
  status: 'approved' | 'deployed';
  deployed_at?: string;
  published_url?: string;
  deployment_error?: string;  // If WordPress publish failed
}
```

**Side Effects:**
- Updates queue item status to 'approved'
- If content action and WordPress configured:
  - Publishes to WordPress
  - Updates status to 'deployed'
  - Updates content.status to 'published'
  - Stores WordPress post ID in rollback_data

**Errors:**
- `400` - Item not pending
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Queue item not found
- `500` - Database error

---

### POST /api/queue/[id]/reject

Reject a pending queue item.

**Auth:** `org:manager`

**Response (200):**

```typescript
{
  // Updated queue item
  status: 'rejected';
}
```

**Side Effects:**
- Updates queue item status to 'rejected'
- If linked to content piece, sets content.status to 'rejected'

**Errors:**
- `400` - Item not pending
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Queue item not found
- `500` - Database error

---

### POST /api/queue/bulk-approve

Approve multiple queue items at once.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  actionIds: string[];  // Array of UUIDs (min 1)
}
```

**Response (200):**

```typescript
{
  approved: number;
  failed: number;
  errors: string[];  // Array of error descriptions
}
```

**Side Effects:**
- Approves each item in sequence
- Attempts WordPress publishing for content actions
- Updates statuses accordingly

**Errors:**
- `400` - Validation failed (empty array)
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Bulk operation failed

---

### GET /api/keywords/[clientId]

Get keywords for a specific client.

**Auth:** `org:manager`

**Query Parameters:**

```
?type=primary|secondary|long_tail
?sort=search_volume|difficulty|position|keyword
?order=asc|desc
?page=1
?limit=50  (max 100)
```

**Response (200):**

```typescript
{
  keywords: Array<{
    id: string;
    keyword: string;
    search_volume: number;
    difficulty: number;
    current_position: number | null;
    previous_position: number | null;
    // ... other fields
  }>;
  total: number;
  page: number;
  limit: number;
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### GET /api/content/[id]

Get a specific content piece (manager view).

**Auth:** `org:manager`

**Response (200):**

```typescript
{
  id: string;
  client_id: string;
  title: string;
  content_type: string;
  body_html: string | null;
  body_markdown: string | null;
  status: string;
  target_keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  word_count: number;
  created_at: string;
  published_at: string | null;
  published_url: string | null;
}
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Content not found
- `500` - Database error

---

### PUT /api/content/[id]

Update a content piece.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  title?: string;
  body_html?: string;
  body_markdown?: string;
  target_keyword?: string;
  meta_title?: string;
  meta_description?: string;
  status?: 'draft' | 'in_review' | 'approved' | 'published' | 'rejected';
}
```

**Response (200):**

```typescript
{
  // Updated content object
}
```

**Side Effects:**
- Updates content record in database

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/content/[id]/publish

Manually publish a content piece.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  publishedUrl: string;  // Must be valid URL
}
```

**Response (200):**

```typescript
{
  // Updated content object with status: 'published'
}
```

**Side Effects:**
- Updates content.status to 'published'
- Sets content.published_at and content.published_url

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/content/[id]/rollback

Rollback a published content piece (unpublish from WordPress).

**Auth:** `org:manager`

**Response (200):**

```typescript
{
  success: true;
  contentId: string;
}
```

**Side Effects:**
- Sets WordPress post to 'draft' status
- Updates content.status to 'approved'
- Clears content.published_url and content.published_at
- Updates agent_action.status to 'rolled_back'

**Errors:**
- `400` - Content not published, or missing WordPress data
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Content or action not found
- `500` - Rollback failed

---

### GET /api/leads

Get all leads from free audits.

**Auth:** `org:manager`

**Query Parameters:**

```
?converted=true|false
```

**Response (200):**

```typescript
Array<{
  id: string;
  domain: string;
  email: string | null;
  audit_score: number;
  audit_results: Record<string, unknown>;
  converted: boolean;
  converted_at: string | null;
  source: string;
  created_at: string;
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/leads/[id]/email

Send a follow-up email to a lead.

**Auth:** `org:manager`

**Rate Limit:** 10 emails / hour per user, 1 email / 24h per lead

**Response (200):**

```typescript
{
  success: true;
}
```

**Side Effects:**
- Sends email via Resend
- Increments rate limit counters

**Errors:**
- `400` - Invalid lead ID or lead has no email
- `401` - Not authenticated
- `403` - Not a manager
- `404` - Lead not found
- `429` - Rate limit exceeded
- `500` - Email send failed

---

### GET /api/gbp/[clientId]/posts

Get Google Business Profile posts for a client.

**Auth:** `org:manager`

**Response (200):**

```typescript
Array<{
  id: string;
  client_id: string;
  post_type: string;
  title: string;
  body: string;
  image_url: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  gbp_post_id: string | null;
  created_at: string;
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/gbp/[clientId]/posts

Create a new GBP post.

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  title: string;
  body: string;
  scheduledAt?: string;  // ISO 8601 datetime
}
```

**Response (201):**

```typescript
{
  id: string;
  client_id: string;
  post_type: 'standard';
  title: string;
  body: string;
  status: 'draft' | 'scheduled';
  scheduled_at: string | null;
  created_at: string;
}
```

**Side Effects:**
- Creates GBP post record in database
- Sets status to 'scheduled' if scheduledAt provided, else 'draft'

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

### POST /api/compliance/check

Check content for compliance issues (HIPAA, FDA, FTC).

**Auth:** Agent API key or `org:manager`

**Request Body:**

```typescript
{
  contentId: string;  // UUID
  content: string;
  contentType: 'blog' | 'gbp_post' | 'social' | 'review_response';
}
```

**Response (202):**

```typescript
{
  status: 'accepted';
  contentId: string;
  contentType: string;
}
```

**Side Effects:**
- Queues compliance check (async, not yet implemented)

**Errors:**
- `400` - Validation failed
- `401` - Unauthorized (missing or invalid API key)
- `500` - Compliance check failed

---

## Agent Routes

Agent routes accept either `x-agent-api-key` header OR `org:manager` role.

### POST /api/agents/run

Run an agent (conductor, scholar, ghostwriter, or analyst).

**Auth:** `org:manager`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
  agentName: 'conductor' | 'scholar' | 'ghostwriter' | 'analyst';
}
```

**Response (202):**

```typescript
{
  runId: string;
  agent: string;
  status: 'running';
  keywordsFound?: number;       // Scholar only
  contentTopics?: string[];     // Scholar only
  scholarKeywords?: number;     // Conductor only
  contentPiecesGenerated?: number; // Conductor only
}
```

**Side Effects:**
- Creates agent run record
- Executes agent logic (Scholar and Conductor implemented)
- For Scholar: discovers keywords, creates keyword records
- For Conductor: orchestrates Scholar + Ghostwriter, creates content

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Agent execution failed

---

### POST /api/agents/conductor/run

Run Conductor orchestrator (agent-to-agent call).

**Auth:** `x-agent-api-key`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
  trigger: 'scheduled' | 'manual' | 'webhook';
}
```

**Response (202):**

```typescript
{
  status: 'accepted';
  clientId: string;
  trigger: string;
}
```

**Side Effects:**
- Queues Conductor run (async, not fully implemented)

**Errors:**
- `400` - Validation failed
- `401` - Invalid API key
- `500` - Agent execution failed

---

### POST /api/agents/scholar/run

Run Scholar keyword research agent.

**Auth:** `x-agent-api-key`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
}
```

**Response (202):**

```typescript
{
  runId: string;
  status: string;
  keywordsFound: number;
  contentTopics: string[];
}
```

**Side Effects:**
- Creates agent run record
- Fetches keyword data from SerpAPI
- Stores keywords in database

**Errors:**
- `400` - Validation failed
- `401` - Invalid API key
- `404` - Client not found
- `500` - Agent execution failed

---

### POST /api/agents/ghostwriter/run

Run Ghostwriter content generation agent.

**Auth:** `x-agent-api-key`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
  contentType: 'blog' | 'gbp_post' | 'social';
  topic: string;
}
```

**Response (202):**

```typescript
{
  status: 'accepted';
  clientId: string;
  contentType: string;
}
```

**Side Effects:**
- Queues Ghostwriter run (async, not fully implemented)

**Errors:**
- `400` - Validation failed
- `401` - Invalid API key
- `500` - Agent execution failed

---

### POST /api/agents/analyst/snapshot

Run Analyst snapshot for metrics collection.

**Auth:** `x-agent-api-key`

**Request Body:**

```typescript
{
  clientId: string;  // UUID
  metrics: Array<'seo' | 'content' | 'competitors' | 'gbp'>;  // Min 1
}
```

**Response (202):**

```typescript
{
  status: 'accepted';
  clientId: string;
  metricsRequested: string[];
}
```

**Side Effects:**
- Queues Analyst snapshot run (async, not fully implemented)

**Errors:**
- `400` - Validation failed
- `401` - Invalid API key
- `500` - Agent execution failed

---

### GET /api/agents/runs/[clientId]

Get agent run history for a client.

**Auth:** `org:manager`

**Response (200):**

```typescript
Array<{
  id: string;
  client_id: string;
  agent: string;
  graph_id: string | null;
  status: string;
  trigger: string;
  config: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}>
```

**Side Effects:** None (read-only)

**Errors:**
- `401` - Not authenticated
- `403` - Not a manager
- `500` - Database error

---

## Onboarding Routes

Onboarding routes require authentication (`requireAuth()`) but do NOT require an organization.

### POST /api/onboarding/create-org

Create a new Clerk organization and client record.

**Auth:** `requireAuth()` (no org required)

**Request Body:**

```typescript
{
  practiceName: string;
  domain: string;
  vertical: string;
  address: string;
  managementMode?: 'managed' | 'self_service';  // Default: 'self_service'
}
```

**Response (201):**

```typescript
{
  orgId: string;
  clientId: string;
  cmsResult: {
    cms: string;
    confidence: string;
    apiAvailable: boolean;
    setupInstructions: string;
  };
}
```

**Side Effects:**
- Creates Clerk organization
- Adds user as 'org:practice_owner' member
- Creates client record in database
- Auto-detects CMS (non-blocking)
- Sets onboarding_step to 2

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `409` - Practice already registered (duplicate domain)
- `500` - Organization creation failed

---

### POST /api/onboarding/google-oauth

Initiate Google OAuth flow.

**Auth:** `requireAuth()`

**Response (200):**

```typescript
{
  url: string;  // Google OAuth authorization URL
}
```

**Side Effects:**
- Generates OAuth URL with userId as state parameter

**Errors:**
- `401` - Not authenticated
- `500` - Google OAuth not configured

---

### GET /api/onboarding/google-oauth/callback

Handle Google OAuth callback.

**Auth:** `requireAuth()`

**Query Parameters:**

```
?code=<auth_code>
?state=<user_id>
?error=<error_code>  // If user denied
```

**Response:** Redirect to `/onboarding/start?step=3&google=connected`

**Side Effects:**
- Exchanges code for access/refresh tokens
- Encrypts and stores tokens in client.google_tokens
- Tests GSC, GA, and GBP scopes
- Redirects to onboarding with connection status

**Errors:**
- Redirects to `/onboarding/start?step=3&google=error` on failure

---

### POST /api/onboarding/detect-cms

Detect CMS type for a given URL.

**Auth:** `requireAuth()`

**Request Body:**

```typescript
{
  url: string;  // Must be valid URL
}
```

**Response (200):**

```typescript
{
  cms: string;
  confidence: string;
  apiAvailable: boolean;
  setupInstructions: string;
}
```

**Side Effects:**
- Fetches and analyzes HTML from URL

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `500` - CMS detection failed

---

### POST /api/onboarding/competitors

Suggest or finalize competitor list.

**Auth:** `requireAuth()`

**Request Body (Suggest):**

```typescript
{
  action: 'suggest';
  clientId: string;
  location: string;
  vertical: string;
}
```

**Request Body (Finalize):**

```typescript
{
  action: 'finalize';
  clientId: string;
  competitors: Array<{
    name: string;
    domain: string;
  }>;  // Min 1, max 5
}
```

**Response (200) - Suggest:**

```typescript
{
  competitors: Array<{
    name: string;
    domain: string;
  }>;
}
```

**Response (200) - Finalize:**

```typescript
{
  success: true;
}
```

**Side Effects:**
- Suggest: Queries SerpAPI for local competitors
- Finalize: Updates client.competitors, sets onboarding_step to 4

**Errors:**
- `400` - Validation failed
- `401` - Not authenticated
- `404` - Client not found
- `500` - Competitor search failed

---

### POST /api/onboarding/complete

Complete onboarding and activate practice.

**Auth:** `requireAuth()`

**Request Body:**

```typescript
{
  clientId: string;
}
```

**Response (200):**

```typescript
{
  success: true;
  redirectTo: '/practice/dashboard';
}
```

**Side Effects:**
- Validates onboarding requirements:
  - Practice name and address
  - At least 1 competitor
  - Google account connected or skipped
- Sets onboarding_step to null
- Sets onboarding_completed_at
- Triggers initial Conductor agent run (async)
- Sends welcome email (async)

**Errors:**
- `400` - Onboarding requirements not met
- `401` - Not authenticated
- `404` - Client not found
- `500` - Completion failed

---

## Cron Routes

Cron routes require `Authorization: Bearer <CRON_SECRET>` header.

### GET /api/cron/publish-gbp

Publish scheduled GBP posts.

**Auth:** Cron secret

**Response (200):**

```typescript
{
  published: number;
  failed: number;
  timestamp: string;  // ISO 8601
}
```

**Side Effects:**
- Queries scheduled GBP posts where scheduled_at <= now
- Publishes to Google Business Profile API
- Updates post.status to 'published'
- Sets post.published_at and post.gbp_post_id

**Errors:**
- `401` - Unauthorized (invalid secret)
- `500` - Cron job failed

---

### GET /api/cron/weekly-pipeline

Run Conductor agent for all active clients.

**Auth:** Cron secret

**Response (200):**

```typescript
{
  triggered: number;
  results: Array<{
    clientId: string;
    status: string;
  }>;
}
```

**Side Effects:**
- Queries all clients with account_health = 'active'
- Runs Conductor agent for each client
- Creates agent run records

**Errors:**
- `401` - Unauthorized (invalid secret)
- `500` - Cron job failed

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Successful request (read) |
| `201` | Created | Successful request (create) |
| `202` | Accepted | Request accepted for async processing |
| `400` | Bad Request | Validation failed or invalid input |
| `401` | Unauthorized | Not authenticated or invalid credentials |
| `403` | Forbidden | Authenticated but lacking required role/permissions |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Resource already exists (e.g., duplicate domain) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

---

## Common Request Patterns

### Multi-Tenancy Enforcement

All database queries MUST filter by `practiceId` or `clientId` to enforce data isolation:

```typescript
// Good: filtered by client_id
const content = await db.query.content.findMany({
  where: eq(content.client_id, clientId)
});

// Bad: data leak
const content = await db.query.content.findMany();
```

### Input Validation

All routes use Zod schemas for input validation:

```typescript
const schema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1),
});

const body = schema.parse(await request.json());
```

### Error Handling

All routes wrap logic in try-catch and return structured errors:

```typescript
try {
  // ... route logic
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Async Side Effects

Non-critical side effects (emails, agent runs) are wrapped in try-catch and do NOT block the response:

```typescript
// Fire-and-forget email
try {
  await resend.emails.send({ ... });
} catch {
  // Email failure should not block response
}
```

---

## Rate Limit Reference

| Route | Limit | Window | Identifier |
|-------|-------|--------|------------|
| POST /api/audit/free | 3 | 1 hour | IP address |
| POST /api/leads/[id]/email | 10 | 1 hour | User ID |
| POST /api/leads/[id]/email | 1 | 24 hours | Lead ID |
| Authenticated API | 100 | 1 minute | User ID |
| Agent API | 10 | 1 minute | Client ID |

---

## Environment Variables

The following environment variables are required:

```bash
# Authentication
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Database
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Encryption
ENCRYPTION_KEY=  # 32-byte hex

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# External APIs
ANTHROPIC_API_KEY=
SERPAPI_API_KEY=
RESEND_API_KEY=
RECAPTCHA_SECRET_KEY=

# Cron
CRON_SECRET=

# Agent
AGENT_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

**End of API Reference v1.0.0**
