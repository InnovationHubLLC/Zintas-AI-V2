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

describe('TASK-30: Wire Approval Queue', () => {
  describe('file existence', () => {
    it('queue page should exist', () => {
      expect(fileExists('app/(manager)/dashboard/queue/page.tsx')).toBe(true)
    })
  })

  describe('queue page: app/(manager)/dashboard/queue/page.tsx', () => {
    const content = readFile('app/(manager)/dashboard/queue/page.tsx')

    // Client component
    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Data fetching from API
    it('should fetch from /api/queue', () => {
      expect(content).toContain('/api/queue')
    })

    it('should fetch clients from /api/clients', () => {
      expect(content).toContain('/api/clients')
    })

    it('should use useEffect for data fetching', () => {
      expect(content).toContain('useEffect')
    })

    it('should use useState for state management', () => {
      expect(content).toContain('useState')
    })

    // No mock data
    it('should not contain mock data', () => {
      expect(content).not.toContain('mockQueueItems')
    })

    // URL search params for filters
    it('should use useSearchParams for URL-persisted filters', () => {
      expect(content).toContain('useSearchParams')
    })

    it('should use useRouter for navigation', () => {
      expect(content).toContain('useRouter')
    })

    // Filters
    it('should have client filter', () => {
      expect(content).toMatch(/client/i)
    })

    it('should have severity filter with critical/warning/info', () => {
      expect(content).toContain('critical')
      expect(content).toContain('warning')
      expect(content).toContain('info')
    })

    it('should show result count', () => {
      expect(content).toMatch(/\.length|count/i)
    })

    // Real API actions
    it('should POST to approve endpoint', () => {
      expect(content).toContain('/approve')
    })

    it('should POST to reject endpoint', () => {
      expect(content).toContain('/reject')
    })

    it('should POST to bulk-approve endpoint', () => {
      expect(content).toContain('/api/queue/bulk-approve')
    })

    // AgentAction interface
    it('should define AgentAction interface or type', () => {
      expect(content).toContain('AgentAction')
    })

    // Table structure
    it('should have checkbox for bulk selection', () => {
      expect(content).toContain('checkbox')
    })

    it('should show client name column', () => {
      expect(content).toContain('client_id')
    })

    it('should show action_type column', () => {
      expect(content).toContain('action_type')
    })

    it('should show description column', () => {
      expect(content).toContain('description')
    })

    it('should show severity column', () => {
      expect(content).toContain('severity')
    })

    it('should show created_at column', () => {
      expect(content).toContain('created_at')
    })

    // Expanded row
    it('should have expandable row detail', () => {
      expect(content).toContain('expanded')
    })

    it('should show proposed_data in expanded row', () => {
      expect(content).toContain('proposed_data')
    })

    // Bulk actions bar
    it('should show bulk actions when items selected', () => {
      expect(content).toContain('selectedIds')
    })

    it('should have Approve Selected button', () => {
      expect(content).toMatch(/Approve.*Selected/i)
    })

    // Empty state
    it('should have empty state message', () => {
      expect(content).toMatch(/no pending|No pending/i)
    })

    // Pagination
    it('should implement pagination', () => {
      expect(content).toMatch(/page|Page|offset|limit/)
    })

    // Keyboard shortcuts
    it('should implement keyboard shortcuts', () => {
      expect(content).toContain('keydown')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
