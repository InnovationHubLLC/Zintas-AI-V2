import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath))
}

describe('TASK-37: Manager Portfolio + Client Overview Wiring', () => {
  describe('file existence', () => {
    it('clients API route should exist', () => {
      expect(fileExists('app/api/clients/route.ts')).toBe(true)
    })

    it('client detail API route should exist', () => {
      expect(fileExists('app/api/clients/[id]/route.ts')).toBe(true)
    })

    it('manager portfolio page should exist', () => {
      expect(fileExists('app/(manager)/dashboard/page.tsx')).toBe(true)
    })

    it('client overview page should exist', () => {
      expect(fileExists('app/(manager)/dashboard/[client]/page.tsx')).toBe(true)
    })
  })

  // ── Clients API Route ───────────────────────────────────────
  describe('clients route: app/api/clients/route.ts', () => {
    const content = readFile('app/api/clients/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    it('should use supabaseAdmin for cross-org access', () => {
      expect(content).toContain('supabaseAdmin')
    })

    it('should fetch pending counts from agent_actions', () => {
      expect(content).toContain('agent_actions')
    })

    it('should include pending_count per client', () => {
      expect(content).toContain('pending_count')
    })

    it('should include last_activity per client', () => {
      expect(content).toContain('last_activity')
    })

    it('should return 500 on error', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Client Detail API Route ─────────────────────────────────
  describe('client detail route: app/api/clients/[id]/route.ts', () => {
    const content = readFile('app/api/clients/[id]/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    it('should fetch client by id', () => {
      expect(content).toContain('getClientById')
    })

    it('should fetch recent agent actions', () => {
      expect(content).toContain('agent_actions')
    })

    it('should return pending_count', () => {
      expect(content).toContain('pending_count')
    })

    it('should return keyword summary with improving count', () => {
      expect(content).toContain('improving_count')
    })

    it('should return page 1 keyword count', () => {
      expect(content).toContain('page_1_count')
    })

    it('should return content_count', () => {
      expect(content).toContain('content_count')
    })

    it('should return 404 for missing client', () => {
      expect(content).toContain('404')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Manager Portfolio Page ──────────────────────────────────
  describe('portfolio page: app/(manager)/dashboard/page.tsx', () => {
    const content = readFile('app/(manager)/dashboard/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should fetch from /api/clients', () => {
      expect(content).toContain('/api/clients')
    })

    // Metrics
    it('should display total clients metric', () => {
      expect(content).toContain('totalClients')
    })

    it('should display total pending metric', () => {
      expect(content).toContain('totalPending')
    })

    it('should display average health score', () => {
      expect(content).toContain('avgHealthScore')
    })

    // Client cards
    it('should display health score per client', () => {
      expect(content).toContain('health_score')
    })

    it('should display pending count per client', () => {
      expect(content).toContain('pending_count')
    })

    it('should display management mode per client', () => {
      expect(content).toContain('management_mode')
    })

    it('should display last activity per client', () => {
      expect(content).toContain('last_activity')
    })

    // Search and filter
    it('should have search functionality', () => {
      expect(content).toContain('search')
    })

    it('should have filter tabs', () => {
      expect(content).toContain('critical')
    })

    // Navigation
    it('should link to client detail', () => {
      expect(content).toContain('/dashboard/')
    })

    it('should link pending to queue', () => {
      expect(content).toContain('/dashboard/queue')
    })

    // Loading and empty states
    it('should show loading skeleton', () => {
      expect(content).toMatch(/skeleton|animate-pulse/i)
    })

    it('should handle empty state', () => {
      expect(content).toMatch(/no clients|empty|nothing/i)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Client Overview Page ────────────────────────────────────
  describe('client overview: app/(manager)/dashboard/[client]/page.tsx', () => {
    const content = readFile('app/(manager)/dashboard/[client]/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Data fetching
    it('should fetch client data from API', () => {
      expect(content).toContain('/api/clients/')
    })

    // Agent run buttons
    it('should have Run Audit button', () => {
      expect(content).toMatch(/Run Audit|runAudit|run.*scholar/i)
    })

    it('should have Generate Content button', () => {
      expect(content).toMatch(/Generate Content|runConductor|conductor/i)
    })

    it('should call agent run API', () => {
      expect(content).toContain('/api/agents/run')
    })

    // Pending actions
    it('should display pending actions', () => {
      expect(content).toContain('pending')
    })

    it('should have approve functionality', () => {
      expect(content).toContain('approve')
    })

    it('should have reject functionality', () => {
      expect(content).toContain('reject')
    })

    // Activity timeline
    it('should show agent activity timeline', () => {
      expect(content).toContain('agent')
    })

    it('should display action timestamps', () => {
      expect(content).toContain('timestamp')
    })

    // Keywords tab
    it('should have keywords tab', () => {
      expect(content).toContain('keywords')
    })

    // Loading
    it('should show loading state', () => {
      expect(content).toMatch(/loading|skeleton|animate-pulse/i)
    })

    it('should import from recharts', () => {
      expect(content).toContain('recharts')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
