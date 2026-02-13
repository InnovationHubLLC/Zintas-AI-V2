# Authentication & Onboarding

**Version:** 1.0
**Last Updated:** 2026-02-12
**Applies To:** Zintas AI V2 (Next.js 15 + Clerk + Supabase)

---

## 1. Authentication Architecture

### Overview

Zintas AI uses **Clerk** as the identity provider with **Supabase** as the data store. Multi-tenancy is enforced through Clerk Organizations mapped to Supabase Row-Level Security (RLS) policies.

### Core Components

| Component | Purpose |
|-----------|---------|
| **Clerk** | User authentication, session management, organization (tenant) management |
| **Supabase RLS** | Row-level data isolation enforced by `org_id` filtering |
| **JWT Claims** | Clerk JWT includes `org_id` claim used by Supabase policies |
| **Middleware** | Route protection, role-based access control, onboarding flow enforcement |

### User Roles

Zintas AI defines two organization-level roles:

1. **`org:practice_owner`**
   - Owner of a single dental practice
   - Access to practice dashboard (`/practice/*`)
   - Can view only their own organization's data
   - Created during onboarding

2. **`org:manager`**
   - Zintas AI agency staff managing multiple practices
   - Access to manager dashboard (`/dashboard/*`)
   - Can see all organizations they manage
   - Assigned manually by Zintas admins

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Clerk
    participant Middleware
    participant Supabase

    User->>Clerk: Sign in
    Clerk->>Clerk: Create session + JWT
    Note over Clerk: JWT includes userId, orgId, orgRole
    Clerk->>Middleware: Return session
    Middleware->>Middleware: Check route protection
    Middleware->>Supabase: Query with org_id filter
    Supabase->>Supabase: Enforce RLS policy
    Supabase->>User: Return isolated data
```

### JWT Structure

Clerk JWT includes these claims (available via `auth()` in Next.js):

```typescript
{
  userId: "user_2abc123...",      // Clerk user ID
  orgId: "org_2xyz456...",         // Clerk organization ID (null if no org)
  orgRole: "org:practice_owner"    // Organization role
}
```

---

## 2. Middleware Routing

**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\middleware.ts`

The middleware enforces authentication and role-based access on every request.

### Route Decision Tree

```mermaid
flowchart TD
    Start[Incoming Request] --> Public{Is route public?}
    Public -->|Yes| Allow[Allow access]
    Public -->|No| Auth{Is user authenticated?}

    Auth -->|No| SignIn[Redirect to /sign-in]
    Auth -->|Yes| HasOrg{Does user have orgId?}

    HasOrg -->|No| OnboardingCheck{Is route /onboarding?}
    OnboardingCheck -->|Yes| Allow
    OnboardingCheck -->|No| Onboard[Redirect to /onboarding/start]

    HasOrg -->|Yes| RouteCheck{Which route?}

    RouteCheck -->|/practice/*| PracticeRole{Is role org:manager?}
    PracticeRole -->|Yes| Dashboard[Redirect to /dashboard]
    PracticeRole -->|No| Allow

    RouteCheck -->|/dashboard/*| ManagerRole{Is role org:practice_owner?}
    ManagerRole -->|Yes| PracticeDash[Redirect to /practice/dashboard]
    ManagerRole -->|No| Allow

    RouteCheck -->|Other| Allow
```

### Route Categories

#### Public Routes (No Auth Required)
- `/` - Homepage
- `/audit(.*)` - Free audit pages
- `/pricing` - Pricing page
- `/api/audit/free(.*)` - Free audit API
- `/sign-in(.*)` - Sign in pages
- `/sign-up(.*)` - Sign up pages

#### Onboarding Routes
- `/onboarding(.*)` - All onboarding steps
- Accessible only if user is authenticated but has no `orgId`

#### Practice Routes
- `/practice(.*)` - Practice owner dashboard
- **Access:** `org:practice_owner` only
- **Redirect:** `org:manager` → `/dashboard`

#### Manager Routes
- `/dashboard(.*)` - Manager dashboard
- **Access:** `org:manager` only
- **Redirect:** `org:practice_owner` → `/practice/dashboard`

### Middleware Implementation

```typescript
export default clerkMiddleware(async (auth, request) => {
  // 1. Allow public routes
  if (isPublicRoute(request)) return

  // 2. Protect all other routes (throws if not authenticated)
  const { userId, orgId, orgRole } = await auth.protect()

  if (!userId) return

  // 3. Force onboarding if no orgId
  if (!orgId && !isOnboardingRoute(request)) {
    return Response.redirect(new URL('/onboarding/start', request.url))
  }

  // 4. Prevent wrong role from accessing wrong dashboard
  if (isPracticeRoute(request) && orgRole === 'org:manager') {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  if (isManagerRoute(request) && orgRole === 'org:practice_owner') {
    return Response.redirect(new URL('/practice/dashboard', request.url))
  }
})
```

---

## 3. Auth Helpers

**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\lib\auth-helpers.ts`

Three helper functions for API route protection.

### `requireAuth()`

Returns authenticated user info or 401 response.

**Use Case:** Any authenticated API route (no specific role required).

```typescript
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    userId,
    orgId: orgId ?? '',
    orgRole: (orgRole as string) ?? '',
  }
}
```

**Example Usage:**

```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult

  const { userId, orgId } = authResult
  // ... proceed with request
}
```

**Response:**
- **Success:** `{ userId, orgId, orgRole }`
- **Failure:** `401 { error: 'Unauthorized' }`

---

### `requireRole(role)`

Returns authenticated user info only if they have the specified role.

**Use Case:** Role-specific API routes (e.g., manager-only endpoints).

```typescript
export async function requireRole(role: OrgRole): Promise<AuthResult | NextResponse> {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  if (orgRole !== role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId, orgId, orgRole: orgRole as string }
}
```

**Example Usage:**

```typescript
export async function POST(request: NextRequest) {
  const authResult = await requireRole('org:manager')
  if (authResult instanceof NextResponse) return authResult

  // Only managers reach this point
}
```

**Response:**
- **Success:** `{ userId, orgId, orgRole }`
- **401:** `{ error: 'Unauthorized' }` (not signed in)
- **403:** `{ error: 'No organization' }` (no org)
- **403:** `{ error: 'Forbidden' }` (wrong role)

---

### `requireAgentKey(request)`

Validates `x-agent-api-key` header for agent-internal routes.

**Use Case:** API routes called by LangGraph agents (not user-facing).

```typescript
export function requireAgentKey(request: Request): NextResponse | null {
  const apiKey = request.headers.get('x-agent-api-key')
  if (apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
```

**Example Usage:**

```typescript
export async function POST(request: NextRequest) {
  const keyError = requireAgentKey(request)
  if (keyError) return keyError

  // Agent authenticated, proceed
}
```

**Response:**
- **Success:** `null`
- **Failure:** `401 { error: 'Unauthorized' }`

---

## 4. Onboarding Wizard (5 Steps)

New users without an `orgId` are redirected to `/onboarding/start` by middleware.

### Onboarding Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Clerk
    participant Supabase
    participant Google
    participant Agent

    Note over User,Agent: Step 1: Practice Profile
    User->>Frontend: Enter practice details
    Frontend->>API: POST /api/onboarding/create-org
    API->>Clerk: Create organization
    Clerk->>API: Return org ID
    API->>Clerk: Add user as practice_owner
    API->>Supabase: Create client record
    API->>Supabase: Auto-detect CMS (optional)
    API->>Frontend: 201 { orgId, clientId, cmsResult }

    Note over User,Agent: Step 2: Google OAuth
    User->>Frontend: Click "Connect Google"
    Frontend->>API: POST /api/onboarding/google-oauth
    API->>Frontend: Return Google consent URL
    Frontend->>Google: Redirect to consent screen
    User->>Google: Grant permissions
    Google->>API: GET /api/onboarding/google-oauth/callback?code=...
    API->>Google: Exchange code for tokens
    Google->>API: Return access + refresh tokens
    API->>API: Encrypt tokens (AES-256-GCM)
    API->>Supabase: Store encrypted tokens
    API->>Google: Test scopes (GSC, GA, GBP)
    API->>Frontend: Redirect to step 3 with results

    Note over User,Agent: Step 3: Competitors
    User->>Frontend: Request suggestions or enter manually
    Frontend->>API: POST /api/onboarding/competitors (suggest)
    API->>Google: Google Places API (via SerpAPI)
    API->>Frontend: Return competitors list
    User->>Frontend: Select/edit competitors
    Frontend->>API: POST /api/onboarding/competitors (finalize)
    API->>Supabase: Save competitors array

    Note over User,Agent: Step 4: CMS Detection
    Frontend->>API: POST /api/onboarding/detect-cms
    API->>API: Fetch HTML + headers
    API->>API: Check WordPress/Wix/Squarespace/etc
    API->>Frontend: Return { cms, confidence, apiAvailable }
    User->>Frontend: Confirm or override

    Note over User,Agent: Step 5: Complete
    Frontend->>API: POST /api/onboarding/complete
    API->>Supabase: Validate requirements
    API->>Supabase: Mark onboarding_completed_at
    API->>Agent: Create initial conductor run (fire-and-forget)
    API->>User: Send welcome email (fire-and-forget)
    API->>Frontend: 200 { redirectTo: '/practice/dashboard' }
```

---

### Step 1: Practice Profile

**Endpoint:** `POST /api/onboarding/create-org`
**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\create-org\route.ts`

**User Sees:** Form with practice name, domain, vertical, address, management mode.

**Request:**

```json
{
  "practiceName": "Bright Smile Dental",
  "domain": "brightsmiledentalnyc.com",
  "vertical": "general_dentistry",
  "address": "123 Main St, New York, NY 10001",
  "managementMode": "self_service"
}
```

**Validation:** Zod schema

```typescript
const CreateOrgSchema = z.object({
  practiceName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
  address: z.string().min(1),
  managementMode: z.enum(['managed', 'self_service']).default('self_service'),
})
```

**Process:**

1. Check for duplicate domain in Supabase
2. Create Clerk organization with `practiceName`
3. Add user as `org:practice_owner` member
4. Create `clients` record in Supabase with:
   - `org_id`: Clerk org ID
   - `onboarding_step`: 2 (next step)
   - `account_health`: 'active'
5. Auto-detect CMS (non-blocking, failure allowed)

**Response:**

```json
{
  "orgId": "org_2abc123",
  "clientId": "uuid-v4",
  "cmsResult": {
    "cms": "wordpress",
    "confidence": "high",
    "apiAvailable": true,
    "version": "6.4.2",
    "setupInstructions": "..."
  }
}
```

**Errors:**

- `409 Conflict` - Domain already registered
- `400 Bad Request` - Validation failed
- `500 Internal Server Error` - Clerk or Supabase error

**Data Created:**

- Clerk: 1 organization, 1 membership
- Supabase: 1 `clients` row

---

### Step 2: Google OAuth

**Initiate:** `POST /api/onboarding/google-oauth`
**Callback:** `GET /api/onboarding/google-oauth/callback`
**Files:**
- `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\google-oauth\route.ts`
- `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\google-oauth\callback\route.ts`

**User Sees:** "Connect Google Account" button, then Google consent screen.

#### 2a. Initiate OAuth

**Request:** `POST /api/onboarding/google-oauth`

**Scopes Requested:**

```typescript
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',     // Search Console
  'https://www.googleapis.com/auth/analytics.readonly',      // Google Analytics
  'https://www.googleapis.com/auth/business.manage',         // Business Profile
]
```

**Response:**

```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=...&state=user_2abc123&access_type=offline&prompt=consent"
}
```

**Frontend Action:** Redirect user to `url`.

#### 2b. Callback

**Triggered By:** Google redirects to `GOOGLE_REDIRECT_URI` after consent.

**Request:** `GET /api/onboarding/google-oauth/callback?code=4/...&state=user_2abc123`

**Process:**

1. CSRF check: Verify `state` matches authenticated `userId`
2. Exchange authorization code for tokens via Google OAuth2 API
3. Parse token response:
   - `access_token`
   - `refresh_token`
   - `expires_in` (seconds)
   - `scope` (granted scopes)
4. Encrypt tokens using AES-256-GCM (see Section 5)
5. Store encrypted tokens in `clients.google_tokens.encrypted`
6. Test each scope with lightweight API calls:
   - **GSC:** `GET /webmasters/v3/sites`
   - **GA:** `GET /analyticsadmin/v1beta/accounts`
   - **GBP:** `GET /mybusinessaccountmanagement/v1/accounts`
7. Redirect to `/onboarding/start?step=3&google=connected&gsc=true&ga=true&gbp=false`

**Response:** HTTP 302 redirect

**Errors:**

- User denies consent: Redirect to `/onboarding/start?step=3&google=error&error_reason=access_denied`
- Token exchange fails: Redirect to `/onboarding/start?step=3&google=error`
- CSRF mismatch: `403 Forbidden`

**Data Modified:**

- `clients.google_tokens`: `{ encrypted: "iv:authTag:ciphertext" }`
- `clients.account_health`: `'active'`

---

### Step 3: Competitors

**Endpoint:** `POST /api/onboarding/competitors`
**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\competitors\route.ts`

**User Sees:** Suggested competitors (via Google Places) or manual entry form.

#### Action: Suggest

**Request:**

```json
{
  "action": "suggest",
  "clientId": "uuid-v4",
  "location": "New York, NY",
  "vertical": "general_dentistry"
}
```

**Process:**

1. Call `findCompetitors(location, vertical, clientDomain)` (uses SerpAPI)
2. Return up to 5 competitors from Google Places

**Response:**

```json
{
  "competitors": [
    { "name": "Manhattan Dental", "domain": "manhattandental.com" },
    { "name": "NYC Smiles", "domain": "nycsmiles.com" }
  ]
}
```

#### Action: Finalize

**Request:**

```json
{
  "action": "finalize",
  "clientId": "uuid-v4",
  "competitors": [
    { "name": "Manhattan Dental", "domain": "manhattandental.com" },
    { "name": "NYC Smiles", "domain": "nycsmiles.com" },
    { "name": "Downtown Dentist", "domain": "downtowndentist.com" }
  ]
}
```

**Validation:** 1-5 competitors, each with `name` and `domain`.

**Process:**

1. Save to `clients.competitors` (JSONB array)
2. Update `clients.onboarding_step` = 4

**Response:**

```json
{ "success": true }
```

**Errors:**

- `404 Not Found` - Client not found
- `400 Bad Request` - Validation failed

**Data Modified:**

- `clients.competitors`: Array of competitor objects
- `clients.onboarding_step`: 4

---

### Step 4: CMS Detection

**Endpoint:** `POST /api/onboarding/detect-cms`
**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\detect-cms\route.ts`

**User Sees:** Detected CMS or "Unknown" with manual selection dropdown.

**Request:**

```json
{
  "url": "https://brightsmiledentalnyc.com"
}
```

**Process:**

1. Normalize URL (prepend `https://` if missing)
2. Fetch HTML and headers with 10s timeout
3. Run detection heuristics (see Section 6)
4. Return result

**Response:**

```json
{
  "cms": "wordpress",
  "confidence": "high",
  "apiAvailable": true,
  "version": "6.4.2",
  "setupInstructions": "Your site runs WordPress. We need an Application Password to publish content. Go to Users → Profile → Application Passwords in your WordPress admin."
}
```

**Errors:**

- `400 Bad Request` - Invalid URL
- `500 Internal Server Error` - Network error (returns `cms: 'error'`)

**Data Modified:** None (client updates CMS manually later).

---

### Step 5: Complete

**Endpoint:** `POST /api/onboarding/complete`
**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\app\api\onboarding\complete\route.ts`

**User Sees:** "Complete Setup" button.

**Request:**

```json
{
  "clientId": "uuid-v4"
}
```

**Validation:**

Checks for minimum requirements before allowing completion:

1. **Practice name and address:** `client.name` and `client.practice_profile.address`
2. **At least 1 competitor:** `client.competitors.length >= 1`
3. **Google tokens:** `client.google_tokens.encrypted` OR `client.google_tokens.skipped`

**Process:**

1. Validate requirements (returns `400` if any missing)
2. Update client:
   - `onboarding_step`: `null` (onboarding complete)
   - `onboarding_completed_at`: Current timestamp
3. Fire-and-forget: Create initial `conductor` agent run
4. Fire-and-forget: Send welcome email via Resend

**Response:**

```json
{
  "success": true,
  "redirectTo": "/practice/dashboard"
}
```

**Errors:**

- `400 Bad Request` - Requirements not met (includes `details` array)
- `404 Not Found` - Client not found
- `500 Internal Server Error` - Database error

**Data Modified:**

- `clients.onboarding_step`: `null`
- `clients.onboarding_completed_at`: ISO timestamp
- `agent_runs`: New row (status: `'running'`)

**Side Effects:**

- Welcome email sent to user's email
- Conductor agent begins Practice Intelligence analysis

---

## 5. Google OAuth Token Lifecycle

**Files:**
- `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\packages\db\encryption.ts`
- `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\packages\db\google-tokens.ts`

### Encryption Scheme

**Algorithm:** AES-256-GCM
**Key:** 32-byte hex string from `process.env.ENCRYPTION_KEY`
**IV:** 12 bytes (randomly generated per encryption)
**Auth Tag:** 16 bytes (GCM authentication tag)

**Encrypted Format:** `iv:authTag:ciphertext` (base64)

```typescript
interface GoogleTokens {
  access_token: string
  refresh_token: string
  expiry_date: number      // Unix timestamp (ms)
  scope: string
}

// Encryption
const encrypted = encryptTokens(tokens)
// Result: "b3JpZ2luYWw=:YXV0aFRhZw==:Y2lwaGVydGV4dA=="

// Decryption
const tokens = decryptTokens(encrypted)
```

### Token Lifecycle

```mermaid
sequenceDiagram
    participant App
    participant DB
    participant Google
    participant Client

    Note over App,Client: Initial OAuth
    App->>Google: Exchange code for tokens
    Google->>App: { access_token, refresh_token, expires_in }
    App->>App: Encrypt tokens
    App->>DB: Store encrypted tokens

    Note over App,Client: API Call (Token Valid)
    App->>DB: Get encrypted tokens
    DB->>App: Return encrypted tokens
    App->>App: Decrypt tokens
    App->>App: Check expiry (> 5 min buffer)
    App->>Google: API call with access_token
    Google->>App: 200 OK

    Note over App,Client: API Call (Token Expired)
    App->>DB: Get encrypted tokens
    DB->>App: Return encrypted tokens
    App->>App: Decrypt tokens
    App->>App: Check expiry (expired)
    App->>Google: POST /token (refresh_token)
    Google->>App: { access_token, expires_in }
    App->>App: Encrypt updated tokens
    App->>DB: Update encrypted tokens
    App->>Google: API call with new access_token
    Google->>App: 200 OK

    Note over App,Client: Refresh Failure
    App->>Google: POST /token (refresh_token)
    Google->>App: 401 Unauthorized
    App->>DB: Set account_health = 'disconnected'
    App->>Client: Notify to re-connect
```

### Auto-Refresh Logic

**Function:** `refreshTokenIfNeeded(clientId)`
**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\packages\db\google-tokens.ts`

**Flow:**

1. Fetch client from database
2. Decrypt stored tokens
3. Check `expiry_date` against current time + 5-minute buffer
4. If valid: Return tokens
5. If expired:
   - POST to `https://oauth2.googleapis.com/token` with `refresh_token`
   - Update `access_token` and `expiry_date`
   - Re-encrypt and store
   - Return fresh tokens
6. If refresh fails:
   - Update `clients.account_health = 'disconnected'`
   - Throw error

**Usage Example:**

```typescript
try {
  const tokens = await refreshTokenIfNeeded(clientId)
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  })
} catch (error) {
  // Token refresh failed — user needs to re-connect
}
```

### Re-Connection Flow

**Trigger:** User clicks "Reconnect Google Account" in settings.

**Process:** Repeat OAuth flow from Step 2 (same endpoints).

**Result:** Overwrites `clients.google_tokens.encrypted` with fresh tokens.

---

## 6. CMS Detection

**File:** `E:\Ideas\Smiley\Zintas-AI\Zintas-AI-V2\packages\audit-engine\detect-cms.ts`

### Detection Strategies

| CMS | Heuristics | Confidence | API Available |
|-----|-----------|------------|---------------|
| **WordPress** | `wp-content`, `wp-includes`, `X-Powered-By: WordPress`, `/wp-json/` endpoint, `<meta name="generator" content="WordPress X.X">` | high | Yes (REST API) |
| **Wix** | `wix.com` in HTML, `X-Wix-*` headers | high (both), medium (one) | Yes (Content API) |
| **Squarespace** | `squarespace.com`, `sqsp` | high (domain), medium (sqsp) | No |
| **Webflow** | `webflow.com`, `class="wf-*"` | high (domain), medium (class) | Yes (CMS API) |
| **GoHighLevel** | `leadconnectorhq`, `gohighlevel` | medium | Yes (GHL API) |
| **Unknown** | No matches | none | No |
| **Error** | Network error | none | No |

### Detection Process

1. Normalize URL (prepend `https://` if missing)
2. Fetch HTML with 10s timeout, follow redirects (max 5)
3. Parse HTML and response headers
4. Check in priority order:
   - WordPress (async, checks `/wp-json/` endpoint)
   - Wix
   - Squarespace
   - Webflow
   - GoHighLevel
5. Return first match or `'unknown'`

### WordPress Detection (Detailed)

```typescript
async function checkWordPress(url: string, html: string, headers: Headers) {
  // Check HTML markers
  const htmlMarkers = html.includes('wp-content') || html.includes('wp-includes')
  const headerMarker = headers.get('x-powered-by')?.toLowerCase().includes('wordpress')

  if (!htmlMarkers && !headerMarker) return null

  // Check REST API availability
  let apiAvailable = false
  try {
    const wpJsonResponse = await fetch(`${url}/wp-json/`, { method: 'HEAD' })
    if (wpJsonResponse.ok) {
      const postsResponse = await fetch(`${url}/wp-json/wp/v2/posts`)
      apiAvailable = postsResponse.ok
    }
  } catch {
    apiAvailable = false
  }

  // Extract version from meta generator tag
  const versionMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']WordPress\s+([\d.]+)["']/i)
  const version = versionMatch?.[1]

  return {
    cms: 'wordpress',
    confidence: 'high',
    apiAvailable,
    version,
    setupInstructions: INSTRUCTIONS.wordpress
  }
}
```

### Setup Instructions

Each CMS includes setup instructions returned to the user:

```typescript
const INSTRUCTIONS: Record<CMSName, string> = {
  wordpress: 'Your site runs WordPress. We need an Application Password to publish content. Go to Users → Profile → Application Passwords in your WordPress admin.',
  wix: 'Your site runs Wix. We\'ll use the Wix Content API. You\'ll need to connect your Wix account.',
  squarespace: 'Your site runs Squarespace. Automated content publishing is limited. We\'ll prepare content for you to paste.',
  webflow: 'Your site runs Webflow. We\'ll use the Webflow CMS API to publish content.',
  ghl: 'Your site runs GoHighLevel. We\'ll integrate via the GHL API.',
}
```

---

## 7. Multi-Tenancy Security Model

### Overview

Zintas AI enforces data isolation using Clerk Organizations mapped to Supabase RLS policies.

```mermaid
flowchart LR
    User[User] -->|Signs In| Clerk
    Clerk -->|JWT with orgId| App[Next.js App]
    App -->|Query with org_id filter| Supabase
    Supabase -->|RLS Policy| Data[(Isolated Data)]

    style User fill:#e1f5ff
    style Clerk fill:#fff4e6
    style App fill:#e8f5e9
    style Supabase fill:#f3e5f5
    style Data fill:#ffebee
```

### Data Isolation Layers

#### 1. Clerk Organization = Tenant

- Each practice is a Clerk organization
- User must be a member of an organization to access data
- `orgId` is included in Clerk JWT

#### 2. Supabase RLS Policies

All tables with `org_id` column enforce RLS:

```sql
-- Example RLS policy for clients table
CREATE POLICY "Users can only see their own org's clients"
  ON clients
  FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can only update their own org's clients"
  ON clients
  FOR UPDATE
  USING (org_id = auth.jwt() ->> 'org_id');
```

#### 3. Application-Level Filtering

All queries include `org_id` filter (defense-in-depth):

```typescript
// Query example (Drizzle ORM)
const client = await db.query.clients.findFirst({
  where: eq(clients.org_id, orgId)  // Always filter by orgId
})
```

### Supabase Client Types

| Client | Purpose | RLS Enforcement |
|--------|---------|-----------------|
| `supabaseServer` | User-facing API routes | **Yes** - Uses Clerk JWT with `org_id` |
| `supabaseAdmin` | Agent operations, system tasks | **No** - Bypasses RLS (service role key) |

**Usage:**

```typescript
// User-facing route (enforces RLS)
import { supabaseServer } from '@packages/db/supabase'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult

  const supabase = supabaseServer()
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', authResult.orgId)  // Redundant but explicit

  return NextResponse.json(data)
}

// Agent route (bypasses RLS for cross-org operations)
import { supabaseAdmin } from '@packages/db/supabase'

export async function POST(request: NextRequest) {
  const keyError = requireAgentKey(request)
  if (keyError) return keyError

  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('clients')
    .select('*')  // Can see all orgs

  return NextResponse.json(data)
}
```

### Role-Based Access

#### Practice Owner (`org:practice_owner`)

- Can see **only their organization's data**
- Access to `/practice/*` routes
- Limited to single-practice operations

#### Manager (`org:manager`)

- Can see **all organizations they manage** (via Clerk org memberships)
- Access to `/dashboard/*` routes
- Multi-practice view and operations

### Cross-Org Access Prevention

**Enforcement Points:**

1. **Middleware:** Redirects wrong role to correct dashboard
2. **API Routes:** `requireRole()` checks role claim in JWT
3. **Database:** RLS policies filter by `org_id` from JWT
4. **Application:** Explicit `org_id` filters in queries

**Example Attack Prevention:**

```typescript
// Malicious request: User tries to access another org's data
const maliciousRequest = await fetch('/api/clients/other-org-uuid', {
  headers: { Authorization: 'Bearer valid-jwt-for-org-abc' }
})

// Defense layers:
// 1. Middleware: Allows route (authenticated)
// 2. API route: requireAuth() checks JWT (valid)
// 3. Database query: eq(clients.org_id, 'org-abc') (from JWT)
// 4. RLS policy: Filters to org-abc only
// Result: 404 Not Found (other-org-uuid not visible)
```

### Security Best Practices

1. **Always filter by `org_id`** in queries (even though RLS enforces it)
2. **Use `supabaseServer`** for user-facing routes (enforces RLS)
3. **Use `supabaseAdmin`** only for agents and system operations
4. **Never trust client-provided `org_id`** — always use JWT claim
5. **Validate ownership** before update/delete operations

---

## Appendix: Environment Variables

| Variable | Purpose | Used By |
|----------|---------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Frontend |
| `CLERK_SECRET_KEY` | Clerk secret key | Backend |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Frontend + Backend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (with RLS) | Frontend + Backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (bypasses RLS) | Backend (agents) |
| `ENCRYPTION_KEY` | AES-256 key (32-byte hex) | Token encryption |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | OAuth flow |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | OAuth flow |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | OAuth flow |
| `AGENT_API_KEY` | Agent authentication key | Agent routes |
| `RESEND_API_KEY` | Resend email API key | Welcome emails |

---

## Testing Checklist

- [ ] Middleware redirects unauthenticated users to `/sign-in`
- [ ] Middleware redirects authenticated users without `orgId` to `/onboarding/start`
- [ ] Middleware prevents `org:manager` from accessing `/practice/*`
- [ ] Middleware prevents `org:practice_owner` from accessing `/dashboard/*`
- [ ] `requireAuth()` returns 401 for unauthenticated requests
- [ ] `requireRole()` returns 403 for wrong role
- [ ] `requireAgentKey()` returns 401 for invalid API key
- [ ] Create-org checks for duplicate domain
- [ ] Create-org creates Clerk org and Supabase client atomically
- [ ] Google OAuth state parameter matches userId (CSRF protection)
- [ ] Google tokens are encrypted before storage
- [ ] Token refresh updates database on success
- [ ] Token refresh marks `account_health = 'disconnected'` on failure
- [ ] Competitor finalization requires 1-5 competitors
- [ ] Onboarding completion validates all requirements
- [ ] Onboarding completion triggers conductor run
- [ ] Onboarding completion sends welcome email
- [ ] CMS detection handles network errors gracefully
- [ ] RLS policies prevent cross-org data access
- [ ] `supabaseServer` queries filtered by JWT `org_id`

---

**End of Documentation**
