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

describe('TASK-24: Wire Manager Keyword Views', () => {
  // ── File Existence ─────────────────────────────────────────
  describe('file existence', () => {
    it('client overview page should exist', () => {
      expect(fileExists('app/(manager)/dashboard/[client]/page.tsx')).toBe(true)
    })

    it('practice dashboard page should exist', () => {
      expect(fileExists('app/(practice)/practice/dashboard/page.tsx')).toBe(true)
    })

    it('practice dashboard API should exist', () => {
      expect(fileExists('app/api/practice/dashboard/route.ts')).toBe(true)
    })
  })

  // ── Client Overview Page ───────────────────────────────────
  describe('client overview: app/(manager)/dashboard/[client]/page.tsx', () => {
    const content = readFile('app/(manager)/dashboard/[client]/page.tsx')

    // Keywords data fetching
    it('should fetch from keywords API', () => {
      expect(content).toContain('/api/keywords/')
    })

    it('should use useState for keywords', () => {
      expect(content).toContain('useState')
    })

    it('should use useEffect for data fetching', () => {
      expect(content).toContain('useEffect')
    })

    // Keywords Tab
    it('should have a keywords tab or section', () => {
      expect(content).toMatch(/[Kk]eywords/)
    })

    // Keyword table columns
    it('should display keyword field', () => {
      expect(content).toContain('keyword')
    })

    it('should display current_position', () => {
      expect(content).toContain('current_position')
    })

    it('should display previous_position', () => {
      expect(content).toContain('previous_position')
    })

    it('should display search_volume', () => {
      expect(content).toContain('search_volume')
    })

    it('should display difficulty', () => {
      expect(content).toContain('difficulty')
    })

    it('should display keyword_type', () => {
      expect(content).toContain('keyword_type')
    })

    // Trend colors
    it('should show green for improved positions', () => {
      expect(content).toMatch(/green|text-green/)
    })

    it('should show red for declined positions', () => {
      expect(content).toMatch(/red|text-red/)
    })

    it('should show gray for new keywords', () => {
      expect(content).toMatch(/gray|text-gray/)
    })

    // KPI stats
    it('should show Keywords Ranked count', () => {
      expect(content).toMatch(/[Kk]eywords?\s*[Rr]anked|keywordsRanked/)
    })

    it('should show Rankings Improving count', () => {
      expect(content).toMatch(/[Rr]ankings?\s*[Ii]mproving|rankingsImproving/)
    })

    // Sorting
    it('should support sort functionality', () => {
      expect(content).toMatch(/sort|Sort/)
    })

    // Type filtering
    it('should support type filter', () => {
      expect(content).toMatch(/filter|Filter|type/)
    })

    // ArrowUp/ArrowDown for trends
    it('should use arrow icons for trends', () => {
      expect(content).toMatch(/ArrowUp|ArrowDown|TrendingUp|TrendingDown/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Practice Dashboard API ─────────────────────────────────
  describe('practice dashboard API: app/api/practice/dashboard/route.ts', () => {
    const content = readFile('app/api/practice/dashboard/route.ts')

    it('should import requireRole', () => {
      expect(content).toContain('requireRole')
    })

    it('should require practice_owner role', () => {
      expect(content).toContain("'org:practice_owner'")
    })

    it('should import getKeywordsByClient', () => {
      expect(content).toContain('getKeywordsByClient')
    })

    it('should return keywordCount', () => {
      expect(content).toContain('keywordCount')
    })

    it('should return rankingsImproving count', () => {
      expect(content).toContain('rankingsImproving')
    })

    it('should return healthScore', () => {
      expect(content).toContain('healthScore')
    })

    it('should handle 500 errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Practice Dashboard Page ────────────────────────────────
  describe('practice dashboard: app/(practice)/practice/dashboard/page.tsx', () => {
    const content = readFile('app/(practice)/practice/dashboard/page.tsx')

    it('should fetch from practice dashboard API', () => {
      expect(content).toContain('/api/practice/dashboard')
    })

    it('should use useState for dashboard data', () => {
      expect(content).toContain('useState')
    })

    it('should use useEffect for data fetching', () => {
      expect(content).toContain('useEffect')
    })

    it('should display Rankings Improving KPI', () => {
      expect(content).toMatch(/[Rr]anking|[Pp]osition/)
    })

    it('should display keyword count', () => {
      expect(content).toMatch(/[Kk]eyword/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
