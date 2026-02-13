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

describe('TASK-36: Practice Content Library + Reports Wiring', () => {
  describe('file existence', () => {
    it('content API route should exist', () => {
      expect(fileExists('app/api/practice/content/route.ts')).toBe(true)
    })

    it('content library page should exist', () => {
      expect(fileExists('app/(practice)/practice/content/page.tsx')).toBe(true)
    })

    it('reports API route should exist', () => {
      expect(fileExists('app/api/practice/reports/route.ts')).toBe(true)
    })

    it('reports page should exist', () => {
      expect(fileExists('app/(practice)/practice/reports/page.tsx')).toBe(true)
    })
  })

  // ── Content API Route ───────────────────────────────────────
  describe('content route: app/api/practice/content/route.ts', () => {
    const content = readFile('app/api/practice/content/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require practice_owner role', () => {
      expect(content).toContain('practice_owner')
    })

    it('should get client by org', () => {
      expect(content).toContain('getClientByOrgId')
    })

    it('should fetch content pieces', () => {
      expect(content).toContain('getContentByClient')
    })

    it('should support status filter', () => {
      expect(content).toContain('status')
    })

    it('should support type filter', () => {
      expect(content).toContain('type')
    })

    it('should return 404 for missing practice', () => {
      expect(content).toContain('404')
    })

    it('should handle errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Content Library Page ────────────────────────────────────
  describe('content page: app/(practice)/practice/content/page.tsx', () => {
    const content = readFile('app/(practice)/practice/content/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should fetch from /api/practice/content', () => {
      expect(content).toContain('/api/practice/content')
    })

    // Grid/list toggle
    it('should support grid view', () => {
      expect(content).toMatch(/grid/i)
    })

    it('should support list view', () => {
      expect(content).toMatch(/list/i)
    })

    it('should have view toggle', () => {
      expect(content).toMatch(/viewMode|view.*toggle|setView/i)
    })

    // Filter tabs
    it('should have All filter', () => {
      expect(content).toContain('all')
    })

    it('should have Published filter', () => {
      expect(content).toMatch(/published/i)
    })

    it('should have In Progress filter', () => {
      expect(content).toMatch(/in_review|in.progress|draft/i)
    })

    // Search
    it('should have search functionality', () => {
      expect(content).toContain('search')
    })

    it('should filter by title', () => {
      expect(content).toContain('title')
    })

    // Content card fields
    it('should display status badge', () => {
      expect(content).toContain('status')
    })

    it('should display content type', () => {
      expect(content).toContain('content_type')
    })

    it('should display target keyword', () => {
      expect(content).toContain('target_keyword')
    })

    // Loading state
    it('should show loading skeleton', () => {
      expect(content).toMatch(/skeleton|animate-pulse/i)
    })

    // Empty state
    it('should handle empty state', () => {
      expect(content).toMatch(/empty|no content|get started|nothing/i)
    })

    it('should import from lucide-react', () => {
      expect(content).toContain('lucide-react')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Reports API Route ───────────────────────────────────────
  describe('reports route: app/api/practice/reports/route.ts', () => {
    const content = readFile('app/api/practice/reports/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should require practice_owner role', () => {
      expect(content).toContain('practice_owner')
    })

    it('should get client by org', () => {
      expect(content).toContain('getClientByOrgId')
    })

    it('should fetch keyword trends', () => {
      expect(content).toContain('getKeywordTrends')
    })

    it('should fetch content by client', () => {
      expect(content).toContain('getContentByClient')
    })

    it('should fetch keyword data', () => {
      expect(content).toContain('getKeywordsByClient')
    })

    // Response shape
    it('should return metrics in response', () => {
      expect(content).toContain('metrics')
    })

    it('should return trafficChart in response', () => {
      expect(content).toContain('trafficChart')
    })

    it('should return rankingsChart in response', () => {
      expect(content).toContain('rankingsChart')
    })

    it('should return contentPerformance in response', () => {
      expect(content).toContain('contentPerformance')
    })

    // Metrics
    it('should calculate rankings improving', () => {
      expect(content).toContain('rankingsImproving')
    })

    it('should calculate page 1 keywords', () => {
      expect(content).toContain('page1')
    })

    it('should include content count', () => {
      expect(content).toContain('contentPublished')
    })

    it('should return 404 for missing practice', () => {
      expect(content).toContain('404')
    })

    it('should handle errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Reports Page ────────────────────────────────────────────
  describe('reports page: app/(practice)/practice/reports/page.tsx', () => {
    const content = readFile('app/(practice)/practice/reports/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should fetch from /api/practice/reports', () => {
      expect(content).toContain('/api/practice/reports')
    })

    // Charts
    it('should import from recharts', () => {
      expect(content).toContain('recharts')
    })

    it('should use AreaChart for traffic', () => {
      expect(content).toContain('AreaChart')
    })

    it('should use BarChart for rankings', () => {
      expect(content).toContain('BarChart')
    })

    it('should use ResponsiveContainer', () => {
      expect(content).toContain('ResponsiveContainer')
    })

    // Tabs
    it('should have traffic tab', () => {
      expect(content).toContain('traffic')
    })

    it('should have rankings tab', () => {
      expect(content).toContain('rankings')
    })

    it('should have content tab', () => {
      expect(content).toContain('content')
    })

    // Rankings grouping
    it('should group rankings by position range', () => {
      expect(content).toMatch(/page.?1|position.*range|page1/i)
    })

    // Keyword table
    it('should show keyword details table', () => {
      expect(content).toContain('keyword')
    })

    it('should show position changes', () => {
      expect(content).toContain('change')
    })

    it('should show search volume', () => {
      expect(content).toContain('volume')
    })

    // Metrics row
    it('should display metrics from API', () => {
      expect(content).toContain('metrics')
    })

    // Loading state
    it('should show loading skeleton', () => {
      expect(content).toMatch(/skeleton|animate-pulse/i)
    })

    // Empty state
    it('should handle empty state', () => {
      expect(content).toMatch(/empty|no data|get started|nothing yet/i)
    })

    it('should import from lucide-react', () => {
      expect(content).toContain('lucide-react')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
