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

describe('TASK-38: Manager Leads Page', () => {
  describe('file existence', () => {
    it('leads API route should exist', () => {
      expect(fileExists('app/api/leads/route.ts')).toBe(true)
    })

    it('manager leads page should exist', () => {
      expect(fileExists('app/(manager)/dashboard/leads/page.tsx')).toBe(true)
    })
  })

  // ── Leads API Route ───────────────────────────────────────
  describe('leads route: app/api/leads/route.ts', () => {
    const content = readFile('app/api/leads/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    it('should support converted filter', () => {
      expect(content).toContain('converted')
    })

    it('should return 500 on error', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Manager Leads Page ────────────────────────────────────
  describe('leads page: app/(manager)/dashboard/leads/page.tsx', () => {
    const content = readFile('app/(manager)/dashboard/leads/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Data fetching
    it('should fetch from /api/leads', () => {
      expect(content).toContain('/api/leads')
    })

    // Table columns
    it('should display domain column', () => {
      expect(content).toContain('domain')
    })

    it('should display email column', () => {
      expect(content).toContain('email')
    })

    it('should display audit score', () => {
      expect(content).toContain('audit_score')
    })

    it('should display source column', () => {
      expect(content).toContain('source')
    })

    it('should display converted status', () => {
      expect(content).toContain('converted')
    })

    it('should display created_at date', () => {
      expect(content).toContain('created_at')
    })

    // Sorting
    it('should have sort functionality', () => {
      expect(content).toMatch(/sort|Sort/)
    })

    it('should support sort by score', () => {
      expect(content).toContain('audit_score')
    })

    it('should support sort by date', () => {
      expect(content).toContain('created_at')
    })

    // Filtering
    it('should have filter for converted status', () => {
      expect(content).toContain('converted')
    })

    it('should have filter for minimum score', () => {
      expect(content).toMatch(/minScore|min_score|minimumScore/)
    })

    it('should have filter for has email', () => {
      expect(content).toMatch(/hasEmail|has_email|email/)
    })

    // Row expansion
    it('should support row expansion', () => {
      expect(content).toMatch(/expand|Expand|expanded/)
    })

    it('should show audit details on expansion', () => {
      expect(content).toContain('audit_results')
    })

    // Follow-up email
    it('should have send follow-up email button', () => {
      expect(content).toMatch(/follow.*up|Follow.*Up|send.*email|Send.*Email/i)
    })

    it('should have email dialog/modal', () => {
      expect(content).toMatch(/dialog|Dialog|modal|Modal/)
    })

    it('should have email template with domain and score', () => {
      expect(content).toMatch(/template|Template|pre.*fill/i)
    })

    it('should call email sending API', () => {
      expect(content).toContain('/api/leads/')
    })

    // CSV export
    it('should have export CSV button', () => {
      expect(content).toMatch(/CSV|csv|export|Export/)
    })

    it('should create downloadable CSV', () => {
      expect(content).toMatch(/download|Download|blob|Blob/)
    })

    // Stats section
    it('should display total leads stat', () => {
      expect(content).toMatch(/totalLeads|total.*leads/i)
    })

    it('should display leads with email stat', () => {
      expect(content).toMatch(/withEmail|with.*email/i)
    })

    it('should display average score stat', () => {
      expect(content).toMatch(/avgScore|average.*score|averageScore/i)
    })

    it('should display conversion rate stat', () => {
      expect(content).toMatch(/conversionRate|conversion.*rate/i)
    })

    // Loading state
    it('should show loading state', () => {
      expect(content).toMatch(/loading|skeleton|animate-pulse/i)
    })

    // Empty state
    it('should handle empty state', () => {
      expect(content).toMatch(/no leads|empty|No leads/i)
    })

    // Grade badge
    it('should display grade badge', () => {
      expect(content).toMatch(/grade|Grade/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Sidebar navigation ────────────────────────────────────
  describe('sidebar navigation', () => {
    const layout = readFile('app/(manager)/layout.tsx')

    it('should have Leads link in sidebar', () => {
      expect(layout).toContain('/dashboard/leads')
    })

    it('should have Leads label', () => {
      expect(layout).toContain('Leads')
    })
  })

  // ── Email API route ───────────────────────────────────────
  describe('lead email API: app/api/leads/[id]/email/route.ts', () => {
    it('email API route should exist', () => {
      expect(fileExists('app/api/leads/[id]/email/route.ts')).toBe(true)
    })

    const content = readFile('app/api/leads/[id]/email/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    it('should use Resend for sending', () => {
      expect(content).toMatch(/resend|Resend/)
    })

    it('should return 404 for missing lead', () => {
      expect(content).toContain('404')
    })

    it('should return 400 for lead without email', () => {
      expect(content).toContain('400')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
