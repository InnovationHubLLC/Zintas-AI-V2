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

describe('TASK-35: Practice Dashboard Wiring', () => {
  describe('file existence', () => {
    it('plain-english translate.ts should exist', () => {
      expect(fileExists('packages/plain-english/translate.ts')).toBe(true)
    })

    it('practice dashboard route should exist', () => {
      expect(fileExists('app/api/practice/dashboard/route.ts')).toBe(true)
    })

    it('practice dashboard page should exist', () => {
      expect(fileExists('app/(practice)/practice/dashboard/page.tsx')).toBe(true)
    })
  })

  // ── Plain English Translate ─────────────────────────────────
  describe('plain-english: packages/plain-english/translate.ts', () => {
    const content = readFile('packages/plain-english/translate.ts')

    // Main export
    it('should export toPlainEnglishWin function', () => {
      expect(content).toMatch(/export function toPlainEnglishWin/)
    })

    it('should accept AgentAction parameter', () => {
      expect(content).toContain('AgentAction')
    })

    it('should return PlainEnglishWin type', () => {
      expect(content).toContain('PlainEnglishWin')
    })

    // Action type translations
    it('should handle content_new action type', () => {
      expect(content).toContain('content_new')
    })

    it('should handle keyword_research action type', () => {
      expect(content).toContain('keyword_research')
    })

    it('should handle gbp_post action type', () => {
      expect(content).toContain('gbp_post')
    })

    it('should handle meta_update action type', () => {
      expect(content).toContain('meta_update')
    })

    it('should handle keyword_improvement action type', () => {
      expect(content).toContain('keyword_improvement')
    })

    // Plain English messaging
    it('should generate published message for content_new', () => {
      expect(content).toMatch(/publish/i)
    })

    it('should mention keyword opportunities for keyword_research', () => {
      expect(content).toMatch(/keyword/i)
    })

    it('should mention Google Business Profile for gbp_post', () => {
      expect(content).toMatch(/Google Business Profile|GBP/i)
    })

    // PlainEnglishWin interface
    it('should define PlainEnglishWin interface', () => {
      expect(content).toMatch(/interface PlainEnglishWin/)
    })

    it('should include message field in PlainEnglishWin', () => {
      expect(content).toContain('message')
    })

    it('should include impact field in PlainEnglishWin', () => {
      expect(content).toContain('impact')
    })

    it('should include timestamp field in PlainEnglishWin', () => {
      expect(content).toContain('timestamp')
    })

    // Type safety
    it('should import AgentAction from db types', () => {
      expect(content).toContain('@packages/db')
    })

    it('should export PlainEnglishWin type', () => {
      expect(content).toContain('export')
      expect(content).toContain('PlainEnglishWin')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Plain English Index ─────────────────────────────────────
  describe('plain-english index: packages/plain-english/index.ts', () => {
    const content = readFile('packages/plain-english/index.ts')

    it('should re-export from translate', () => {
      expect(content).toContain('./translate')
    })
  })

  // ── Practice Dashboard API ──────────────────────────────────
  describe('dashboard route: app/api/practice/dashboard/route.ts', () => {
    const content = readFile('app/api/practice/dashboard/route.ts')

    // Auth
    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require practice_owner role', () => {
      expect(content).toContain('practice_owner')
    })

    // Data aggregation
    it('should get client by org', () => {
      expect(content).toContain('getClientByOrgId')
    })

    it('should fetch keywords', () => {
      expect(content).toContain('getKeywordsByClient')
    })

    it('should fetch content pieces', () => {
      expect(content).toContain('getContentByClient')
    })

    it('should calculate keywords on page 1', () => {
      expect(content).toContain('page1')
    })

    it('should calculate rankings improving', () => {
      expect(content).toContain('rankingsImproving')
    })

    it('should include health score in KPIs', () => {
      expect(content).toContain('healthScore')
    })

    // Recent wins
    it('should fetch agent actions for wins', () => {
      expect(content).toContain('agent_actions')
    })

    it('should filter deployed actions', () => {
      expect(content).toContain('deployed')
    })

    it('should use toPlainEnglishWin for translations', () => {
      expect(content).toContain('toPlainEnglishWin')
    })

    // Response shape
    it('should return kpis in response', () => {
      expect(content).toContain('kpis')
    })

    it('should return wins in response', () => {
      expect(content).toContain('wins')
    })

    it('should return trafficChart in response', () => {
      expect(content).toContain('trafficChart')
    })

    // Error handling
    it('should handle errors with try-catch', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    it('should return 404 for missing practice', () => {
      expect(content).toContain('404')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Practice Dashboard Page ─────────────────────────────────
  describe('dashboard page: app/(practice)/practice/dashboard/page.tsx', () => {
    const content = readFile('app/(practice)/practice/dashboard/page.tsx')

    // Client component
    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Data fetching
    it('should fetch from /api/practice/dashboard', () => {
      expect(content).toContain('/api/practice/dashboard')
    })

    // KPI cards
    it('should display health score', () => {
      expect(content).toContain('healthScore')
    })

    it('should display rankings improving', () => {
      expect(content).toContain('rankingsImproving')
    })

    it('should display content published count', () => {
      expect(content).toContain('contentPublished')
    })

    // Recent wins from API
    it('should render wins from API data', () => {
      expect(content).toContain('wins')
    })

    it('should display win messages', () => {
      expect(content).toContain('message')
    })

    it('should display win impact levels', () => {
      expect(content).toContain('impact')
    })

    // Traffic chart
    it('should use Recharts AreaChart', () => {
      expect(content).toContain('AreaChart')
    })

    it('should use ResponsiveContainer', () => {
      expect(content).toContain('ResponsiveContainer')
    })

    it('should render traffic chart data from API', () => {
      expect(content).toContain('trafficChart')
    })

    // Loading state
    it('should show loading skeleton', () => {
      expect(content).toMatch(/skeleton|animate-pulse/i)
    })

    // Empty state
    it('should handle empty state for new practices', () => {
      expect(content).toMatch(/empty|no data|get started|nothing yet/i)
    })

    // Imports
    it('should import from recharts', () => {
      expect(content).toContain('recharts')
    })

    it('should import from lucide-react', () => {
      expect(content).toContain('lucide-react')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
