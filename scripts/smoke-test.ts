/**
 * Zintas AI — End-to-End Smoke Test Script
 *
 * Run:  npx tsx scripts/smoke-test.ts
 * Quick: npx tsx scripts/smoke-test.ts --skip-agents
 *
 * Required env vars (reads from .env automatically):
 *   NEXT_PUBLIC_SUPABASE_URL        — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY       — Supabase service role key (for DB verification + cleanup)
 *
 * Optional env vars:
 *   SMOKE_TEST_API_URL              — Base API URL (default: http://localhost:3000)
 *   SMOKE_TEST_MANAGER_TOKEN        — Clerk JWT for org:manager role
 *   SMOKE_TEST_PRACTICE_TOKEN       — Clerk JWT for org:practice_owner role
 *   CLERK_SECRET_KEY                — For Clerk org cleanup
 *
 * To generate Clerk tokens:
 *   1. Sign into the Clerk dev dashboard
 *   2. Go to Users → select test user → Sessions → copy JWT
 *   3. Ensure the user has the appropriate role in the target org
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as crypto from 'crypto'

dotenv.config()

// ─── Types ────────────────────────────────────────────────────────

interface SmokeTestConfig {
  apiUrl: string
  managerToken: string
  practiceToken: string
  skipAgents: boolean
  supabaseUrl: string
  supabaseServiceKey: string
  clerkSecretKey: string
}

interface TestContext {
  leadId: string | null
  orgId: string | null
  clientId: string | null
  contentPieceId: string | null
  queueItemId: string | null
}

interface SuiteResult {
  name: string
  passed: boolean
  duration: number
  assertions: number
  error: string | null
}

interface ApiFetchOptions {
  method?: string
  body?: Record<string, unknown>
  role?: 'manager' | 'practice' | 'none'
  headers?: Record<string, string>
}

interface ApiFetchResult {
  status: number
  data: Record<string, unknown>
}

// ─── Utilities ────────────────────────────────────────────────────

function loadConfig(): SmokeTestConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  return {
    apiUrl: process.env.SMOKE_TEST_API_URL ?? 'http://localhost:3000',
    managerToken: process.env.SMOKE_TEST_MANAGER_TOKEN ?? '',
    practiceToken: process.env.SMOKE_TEST_PRACTICE_TOKEN ?? '',
    skipAgents: process.argv.includes('--skip-agents'),
    supabaseUrl,
    supabaseServiceKey,
    clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
  }
}

function createSupabase(config: SmokeTestConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function log(emoji: string, message: string): void {
  console.log(`[${timestamp()}] ${emoji} ${message}`)
}

let assertionCount = 0

function assert(label: string, condition: boolean, detail?: string): void {
  assertionCount++
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    const msg = detail ? `${label} — ${detail}` : label
    console.log(`  ✗ ${msg}`)
    throw new Error(`Assertion failed: ${msg}`)
  }
}

async function apiFetch(
  config: SmokeTestConfig,
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiFetchResult> {
  const { method = 'GET', body, role = 'none', headers = {} } = options
  const url = `${config.apiUrl}${path}`

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (role === 'manager' && config.managerToken) {
    fetchHeaders['Authorization'] = `Bearer ${config.managerToken}`
  } else if (role === 'practice' && config.practiceToken) {
    fetchHeaders['Authorization'] = `Bearer ${config.practiceToken}`
  }

  const response = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data: Record<string, unknown> = {}
  try {
    data = (await response.json()) as Record<string, unknown>
  } catch {
    // Response may not be JSON
  }

  return { status: response.status, data }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function pollAgentRun(
  config: SmokeTestConfig,
  clientId: string,
  runId: string,
  timeoutMs: number
): Promise<Record<string, unknown> | null> {
  const start = Date.now()
  const interval = 5000

  while (Date.now() - start < timeoutMs) {
    await sleep(interval)
    const { status, data } = await apiFetch(config, `/api/agents/runs?clientId=${clientId}`, {
      role: 'manager',
    })

    if (status === 200 && Array.isArray(data)) {
      const run = data.find((r: Record<string, unknown>) => r.id === runId)
      if (run && run.status !== 'running') {
        return run as Record<string, unknown>
      }
    }
  }

  return null
}

// ─── Suite 1: Audit Tool ──────────────────────────────────────────

async function testAuditTool(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('🔍', 'Running: AUDIT TOOL')

  try {
    const uniqueIp = `smoke-test-${crypto.randomUUID()}`
    const { status, data } = await apiFetch(config, '/api/audit/free', {
      method: 'POST',
      body: {
        url: 'https://example-dental.com',
        email: 'smoke-test@zintas.ai',
        recaptchaToken: 'smoke-test-bypass',
      },
      headers: { 'x-forwarded-for': uniqueIp },
    })

    assert('POST /api/audit/free returns 201', status === 201, `got ${status}`)
    assert('Response has id', typeof data.id === 'string')

    const score = data.score as number
    assert('Score is 0-100', typeof score === 'number' && score >= 0 && score <= 100, `got ${score}`)
    assert('Grade is valid', ['A', 'B', 'C', 'D', 'F'].includes(data.grade as string), `got ${data.grade}`)
    assert('Has 7 findings', Array.isArray(data.findings) && (data.findings as unknown[]).length === 7, `got ${(data.findings as unknown[])?.length ?? 0}`)

    ctx.leadId = data.id as string

    // DB verification
    const { data: lead } = await db
      .from('leads')
      .select('id, audit_score')
      .eq('id', ctx.leadId)
      .single()

    assert('Lead exists in database', lead !== null)
    assert('DB audit_score matches response', lead?.audit_score === score)

    const totalAssertions = assertionCount
    log('✅', `AUDIT TOOL: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'AUDIT TOOL', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `AUDIT TOOL: FAIL (${message})`)
    return { name: 'AUDIT TOOL', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 2: Onboarding ──────────────────────────────────────────

async function testOnboarding(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('🏗️', 'Running: ONBOARDING')

  try {
    const uniqueDomain = `smoke-test-${Date.now()}.example.com`

    // Step 1: Create org
    const { status: createStatus, data: createData } = await apiFetch(config, '/api/onboarding/create-org', {
      method: 'POST',
      body: {
        practiceName: 'Smoke Test Dental',
        domain: uniqueDomain,
        vertical: 'dental',
        address: '123 Test St, Testville, TX 75001',
        managementMode: 'managed',
      },
      role: 'practice',
    })

    assert('POST /api/onboarding/create-org returns 201', createStatus === 201, `got ${createStatus}`)
    assert('Response has orgId', typeof createData.orgId === 'string')
    assert('Response has clientId', typeof createData.clientId === 'string')

    ctx.orgId = createData.orgId as string
    ctx.clientId = createData.clientId as string

    // Step 2: Detect CMS
    const { status: cmsStatus, data: cmsData } = await apiFetch(config, '/api/onboarding/detect-cms', {
      method: 'POST',
      body: { url: `https://${uniqueDomain}` },
      role: 'practice',
    })

    assert('POST /api/onboarding/detect-cms returns 200', cmsStatus === 200, `got ${cmsStatus}`)
    assert('CMS detection has cms field', typeof cmsData.cms === 'string')

    // Step 3: Set prerequisites via DB (competitors, google_tokens, onboarding_step)
    const { error: updateError } = await db
      .from('clients')
      .update({
        competitors: [{ name: 'Test Competitor', domain: 'competitor.com' }],
        google_tokens: { skipped: true },
        onboarding_step: 4,
        practice_profile: {
          name: 'Smoke Test Dental',
          address: '123 Test St, Testville, TX 75001',
        },
      })
      .eq('id', ctx.clientId)

    assert('DB prerequisites set', updateError === null, updateError?.message)

    // Step 4: Complete onboarding
    const { status: completeStatus, data: completeData } = await apiFetch(config, '/api/onboarding/complete', {
      method: 'POST',
      body: { clientId: ctx.clientId },
      role: 'practice',
    })

    assert('POST /api/onboarding/complete returns 200', completeStatus === 200, `got ${completeStatus}`)
    assert('Response has success: true', completeData.success === true)

    // Step 5: DB verification
    const { data: client } = await db
      .from('clients')
      .select('onboarding_completed_at')
      .eq('id', ctx.clientId)
      .single()

    assert('onboarding_completed_at is set', client?.onboarding_completed_at !== null)

    const totalAssertions = assertionCount
    log('✅', `ONBOARDING: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'ONBOARDING', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `ONBOARDING: FAIL (${message})`)
    return { name: 'ONBOARDING', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 3: Scholar Agent ───────────────────────────────────────

async function testScholarAgent(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('🎓', 'Running: SCHOLAR AGENT')

  try {
    if (!ctx.clientId) throw new Error('No clientId — onboarding must pass first')

    const { status, data } = await apiFetch(config, '/api/agents/run', {
      method: 'POST',
      body: { clientId: ctx.clientId, agentName: 'scholar' },
      role: 'manager',
    })

    assert('POST /api/agents/run returns 202', status === 202, `got ${status}`)
    assert('Response has runId', typeof data.runId === 'string')
    assert('Agent is scholar', data.agent === 'scholar')

    // If status is 'running', poll for completion
    if (data.status === 'running') {
      log('⏳', 'Scholar agent running, polling for completion (timeout: 60s)...')
      const result = await pollAgentRun(config, ctx.clientId, data.runId as string, 60000)
      assert('Agent completed within timeout', result !== null, 'timed out after 60s')
      assert('Agent status is completed', result?.status === 'completed', `got ${result?.status}`)
    } else {
      assert('Agent completed synchronously', data.status === 'completed' || data.status === 'running')
    }

    // DB verification: keywords exist
    const { count } = await db
      .from('keywords')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', ctx.clientId)

    assert('Keywords added to database', (count ?? 0) > 0, `found ${count ?? 0} keywords`)

    const totalAssertions = assertionCount
    log('✅', `SCHOLAR AGENT: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'SCHOLAR AGENT', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `SCHOLAR AGENT: FAIL (${message})`)
    return { name: 'SCHOLAR AGENT', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 4: Ghostwriter Agent ───────────────────────────────────

async function testGhostwriterAgent(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('✍️', 'Running: GHOSTWRITER AGENT')

  try {
    if (!ctx.clientId) throw new Error('No clientId — onboarding must pass first')

    const { status, data } = await apiFetch(config, '/api/agents/run', {
      method: 'POST',
      body: { clientId: ctx.clientId, agentName: 'ghostwriter' },
      role: 'manager',
    })

    assert('POST /api/agents/run returns 202', status === 202, `got ${status}`)
    assert('Response has runId', typeof data.runId === 'string')

    // Ghostwriter may return 'running' stub — poll if needed
    if (data.status === 'running') {
      log('⏳', 'Ghostwriter agent running, polling for completion (timeout: 90s)...')
      const result = await pollAgentRun(config, ctx.clientId, data.runId as string, 90000)
      if (result === null) {
        log('⚠️', 'Ghostwriter timed out — checking DB for partial results')
      }
    }

    // DB verification: content piece exists
    const { data: contentPieces } = await db
      .from('content_pieces')
      .select('id, status, compliance_status')
      .eq('client_id', ctx.clientId)
      .in('status', ['in_review', 'draft', 'approved'])
      .limit(1)

    if (contentPieces && contentPieces.length > 0) {
      ctx.contentPieceId = contentPieces[0].id
      assert('Content piece created', true)
      assert('Content piece has status', ['in_review', 'draft', 'approved'].includes(contentPieces[0].status))
    } else {
      assert('Content piece created (may be pending if ghostwriter is stub)', false, 'no content pieces found')
    }

    // DB verification: agent action exists
    const { data: actions } = await db
      .from('agent_actions')
      .select('id, status')
      .eq('client_id', ctx.clientId)
      .eq('status', 'pending')
      .limit(1)

    if (actions && actions.length > 0) {
      ctx.queueItemId = actions[0].id
      assert('Pending agent action exists', true)
    } else {
      // Check for any actions (may have been auto-approved)
      const { count } = await db
        .from('agent_actions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', ctx.clientId)

      assert('Agent action exists', (count ?? 0) > 0, `found ${count ?? 0} actions`)
    }

    const totalAssertions = assertionCount
    log('✅', `GHOSTWRITER AGENT: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'GHOSTWRITER AGENT', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `GHOSTWRITER AGENT: FAIL (${message})`)
    return { name: 'GHOSTWRITER AGENT', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 5: Approval Flow ──────────────────────────────────────

async function testApprovalFlow(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('✔️', 'Running: APPROVAL FLOW')

  try {
    if (!ctx.clientId) throw new Error('No clientId — onboarding must pass first')

    // Get queue items
    const { status: queueStatus, data: queueData } = await apiFetch(
      config,
      `/api/queue?clientId=${ctx.clientId}&status=pending`,
      { role: 'manager' }
    )

    assert('GET /api/queue returns 200', queueStatus === 200, `got ${queueStatus}`)

    const queueItems = Array.isArray(queueData) ? queueData : []

    if (queueItems.length === 0 && ctx.queueItemId) {
      // Try to approve the known item directly
      log('⚠️', 'Queue empty via API, using stored queueItemId')
    } else if (queueItems.length > 0) {
      ctx.queueItemId = (queueItems[0] as Record<string, unknown>).id as string
      assert('Queue has pending items', true)
    }

    if (!ctx.queueItemId) {
      assert('Has queue item to approve', false, 'no pending items found')
    }

    // Approve the item
    const { status: approveStatus, data: approveData } = await apiFetch(
      config,
      `/api/queue/${ctx.queueItemId}/approve`,
      { method: 'POST', role: 'manager' }
    )

    assert('POST /api/queue/{id}/approve returns 200', approveStatus === 200, `got ${approveStatus}`)

    // DB verification
    const { data: action } = await db
      .from('agent_actions')
      .select('status')
      .eq('id', ctx.queueItemId)
      .single()

    assert(
      'Action status is approved or deployed',
      action !== null && ['approved', 'deployed'].includes(action.status),
      `got ${action?.status}`
    )

    const totalAssertions = assertionCount
    log('✅', `APPROVAL FLOW: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'APPROVAL FLOW', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `APPROVAL FLOW: FAIL (${message})`)
    return { name: 'APPROVAL FLOW', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 6: Practice Dashboard ──────────────────────────────────

async function testPracticeDashboard(
  config: SmokeTestConfig,
  ctx: TestContext
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('📊', 'Running: PRACTICE DASHBOARD')

  try {
    const { status, data } = await apiFetch(config, '/api/practice/dashboard', {
      role: 'practice',
    })

    assert('GET /api/practice/dashboard returns 200', status === 200, `got ${status}`)

    const kpis = data.kpis as Record<string, unknown> | undefined
    assert('Response has kpis', kpis !== undefined && kpis !== null)
    assert('KPIs has healthScore', typeof kpis?.healthScore === 'number')
    assert('KPIs has keywordCount', typeof kpis?.keywordCount === 'number')
    assert('KPIs has contentPublished', typeof kpis?.contentPublished === 'number')

    assert('Response has wins array', Array.isArray(data.wins))

    const client = data.client as Record<string, unknown> | undefined
    assert('Response has client', client !== undefined && client !== null)
    assert('Client has name', typeof client?.name === 'string')

    const totalAssertions = assertionCount
    log('✅', `PRACTICE DASHBOARD: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'PRACTICE DASHBOARD', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `PRACTICE DASHBOARD: FAIL (${message})`)
    return { name: 'PRACTICE DASHBOARD', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Suite 7: Cleanup ─────────────────────────────────────────────

async function cleanup(
  config: SmokeTestConfig,
  ctx: TestContext,
  db: SupabaseClient
): Promise<SuiteResult> {
  const start = Date.now()
  assertionCount = 0
  log('🧹', 'Running: CLEANUP')

  try {
    // Delete client (cascades to keywords, content_pieces, agent_actions, agent_runs, gbp_posts)
    if (ctx.clientId) {
      const { error: clientError } = await db.from('clients').delete().eq('id', ctx.clientId)
      assert('Client deleted', clientError === null, clientError?.message)
    }

    // Delete lead (separate table, no cascade from clients)
    if (ctx.leadId) {
      const { error: leadError } = await db.from('leads').delete().eq('id', ctx.leadId)
      assert('Lead deleted', leadError === null, leadError?.message)
    }

    // Delete Clerk org if secret key available
    if (ctx.orgId && config.clerkSecretKey) {
      try {
        const clerkApiUrl = `https://api.clerk.com/v1/organizations/${ctx.orgId}`
        const response = await fetch(clerkApiUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${config.clerkSecretKey}` },
        })
        assert('Clerk org deleted', response.ok || response.status === 404, `status ${response.status}`)
      } catch (err) {
        log('⚠️', `Clerk org cleanup failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    } else if (ctx.orgId) {
      log('⚠️', `Clerk org ${ctx.orgId} not deleted (CLERK_SECRET_KEY not set)`)
    }

    // Verify cleanup
    if (ctx.clientId) {
      const { count } = await db
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('id', ctx.clientId)
      assert('Client removed from DB', count === 0)
    }

    if (ctx.leadId) {
      const { count } = await db
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('id', ctx.leadId)
      assert('Lead removed from DB', count === 0)
    }

    const totalAssertions = assertionCount
    log('✅', `CLEANUP: PASS (${((Date.now() - start) / 1000).toFixed(1)}s)`)
    return { name: 'CLEANUP', passed: true, duration: Date.now() - start, assertions: totalAssertions, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log('❌', `CLEANUP: FAIL (${message})`)
    return { name: 'CLEANUP', passed: false, duration: Date.now() - start, assertions: assertionCount, error: message }
  }
}

// ─── Summary ──────────────────────────────────────────────────────

function printSummary(results: SuiteResult[], skippedCount: number): void {
  console.log('')
  console.log('═══════════════════════════════════════')

  for (const r of results) {
    const emoji = r.passed ? '✅' : '❌'
    const time = (r.duration / 1000).toFixed(1)
    console.log(`  ${emoji} ${r.name}: ${r.passed ? 'PASS' : 'FAIL'} (${time}s)`)
    if (r.error) {
      console.log(`     Error: ${r.error}`)
    }
  }

  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const skippedStr = skippedCount > 0 ? ` (${skippedCount} skipped)` : ''
  const totalTime = (results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(1)

  console.log('')
  console.log(`  Results: ${passed}/${total} passed${skippedStr}`)
  console.log(`  Total time: ${totalTime}s`)
  console.log('═══════════════════════════════════════')
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const config = loadConfig()
  const db = createSupabase(config)

  const ctx: TestContext = {
    leadId: null,
    orgId: null,
    clientId: null,
    contentPieceId: null,
    queueItemId: null,
  }

  const mode = config.skipAgents ? 'quick (agents skipped)' : 'full'

  console.log('')
  console.log('═══════════════════════════════════════')
  console.log('  Zintas AI — End-to-End Smoke Test')
  console.log(`  Target: ${config.apiUrl}`)
  console.log(`  Mode: ${mode}`)
  console.log('═══════════════════════════════════════')
  console.log('')

  const results: SuiteResult[] = []
  let skippedCount = 0

  try {
    // Suite 1: Audit Tool (public, always runs)
    results.push(await testAuditTool(config, ctx, db))

    // Suite 2: Onboarding (requires auth)
    if (config.practiceToken) {
      results.push(await testOnboarding(config, ctx, db))
    } else {
      log('⏭️', 'Skipping ONBOARDING (SMOKE_TEST_PRACTICE_TOKEN not set)')
      skippedCount++
    }

    // Suite 3: Scholar Agent
    if (!config.skipAgents && config.managerToken && ctx.clientId) {
      results.push(await testScholarAgent(config, ctx, db))
    } else {
      log('⏭️', `Skipping SCHOLAR AGENT${config.skipAgents ? ' (--skip-agents)' : ' (no token or clientId)'}`)
      skippedCount++
    }

    // Suite 4: Ghostwriter Agent
    if (!config.skipAgents && config.managerToken && ctx.clientId) {
      results.push(await testGhostwriterAgent(config, ctx, db))
    } else {
      log('⏭️', `Skipping GHOSTWRITER AGENT${config.skipAgents ? ' (--skip-agents)' : ''}`)
      skippedCount++
    }

    // Suite 5: Approval Flow
    if (!config.skipAgents && config.managerToken && ctx.queueItemId) {
      results.push(await testApprovalFlow(config, ctx, db))
    } else {
      log('⏭️', `Skipping APPROVAL FLOW${config.skipAgents ? ' (--skip-agents)' : ' (no queue items)'}`)
      skippedCount++
    }

    // Suite 6: Practice Dashboard
    if (config.practiceToken) {
      results.push(await testPracticeDashboard(config, ctx))
    } else {
      log('⏭️', 'Skipping PRACTICE DASHBOARD (SMOKE_TEST_PRACTICE_TOKEN not set)')
      skippedCount++
    }
  } finally {
    // Suite 7: Cleanup (always runs)
    results.push(await cleanup(config, ctx, db))
  }

  printSummary(results, skippedCount)

  const allPassed = results.every((r) => r.passed)
  process.exit(allPassed ? 0 : 1)
}

void main()
