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

describe('TASK-28: Approval → Publish Flow', () => {
  describe('file existence', () => {
    it('approve route should exist', () => {
      expect(fileExists('app/api/queue/[id]/approve/route.ts')).toBe(true)
    })

    it('reject route should exist', () => {
      expect(fileExists('app/api/queue/[id]/reject/route.ts')).toBe(true)
    })

    it('bulk-approve route should exist', () => {
      expect(fileExists('app/api/queue/bulk-approve/route.ts')).toBe(true)
    })

    it('rollback route should exist', () => {
      expect(fileExists('app/api/content/[id]/rollback/route.ts')).toBe(true)
    })

    it('queue queries should exist', () => {
      expect(fileExists('packages/db/queries/queue.ts')).toBe(true)
    })
  })

  // ── Approve Route ──────────────────────────────────────────────
  describe('approve route: app/api/queue/[id]/approve/route.ts', () => {
    const content = readFile('app/api/queue/[id]/approve/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("requireRole('org:manager')")
    })

    it('should import getQueueItemById', () => {
      expect(content).toContain('getQueueItemById')
    })

    it('should check item status is pending', () => {
      expect(content).toContain("'pending'")
    })

    it('should return 404 when item not found', () => {
      expect(content).toContain('404')
    })

    it('should return 400 for non-pending items', () => {
      expect(content).toContain('400')
    })

    it('should import WordPressClient', () => {
      expect(content).toContain('WordPressClient')
    })

    it('should import from wordpress integration', () => {
      expect(content).toContain('@packages/agents/integrations/wordpress')
    })

    it('should check for content_new action type', () => {
      expect(content).toContain("'content_new'")
    })

    it('should check for content_edit action type', () => {
      expect(content).toContain("'content_edit'")
    })

    it('should import getContentById', () => {
      expect(content).toContain('getContentById')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import publishContent', () => {
      expect(content).toContain('publishContent')
    })

    it('should call publishPost on WordPressClient', () => {
      expect(content).toContain('publishPost')
    })

    it('should access cms_credentials from client', () => {
      expect(content).toContain('cms_credentials')
    })

    it('should store rollback_data with wordpress post id', () => {
      expect(content).toContain('rollback_data')
    })

    it('should set deployed_at timestamp', () => {
      expect(content).toContain('deployed_at')
    })

    it('should set action status to deployed', () => {
      expect(content).toContain("'deployed'")
    })

    it('should handle deployment errors gracefully', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    it('should import approveQueueItem', () => {
      expect(content).toContain('approveQueueItem')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Reject Route ───────────────────────────────────────────────
  describe('reject route: app/api/queue/[id]/reject/route.ts', () => {
    const content = readFile('app/api/queue/[id]/reject/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("requireRole('org:manager')")
    })

    it('should import getQueueItemById', () => {
      expect(content).toContain('getQueueItemById')
    })

    it('should check item status is pending', () => {
      expect(content).toContain("'pending'")
    })

    it('should return 404 when item not found', () => {
      expect(content).toContain('404')
    })

    it('should return 400 for non-pending items', () => {
      expect(content).toContain('400')
    })

    it('should import updateContent', () => {
      expect(content).toContain('updateContent')
    })

    it('should update linked content to rejected', () => {
      expect(content).toContain("'rejected'")
    })

    it('should check content_piece_id exists', () => {
      expect(content).toContain('content_piece_id')
    })

    it('should import rejectQueueItem', () => {
      expect(content).toContain('rejectQueueItem')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Bulk Approve Route ─────────────────────────────────────────
  describe('bulk-approve route: app/api/queue/bulk-approve/route.ts', () => {
    const content = readFile('app/api/queue/bulk-approve/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("requireRole('org:manager')")
    })

    it('should validate with zod schema', () => {
      expect(content).toContain('z.object')
    })

    it('should accept actionIds array', () => {
      expect(content).toContain('actionIds')
    })

    it('should import getQueueItemById', () => {
      expect(content).toContain('getQueueItemById')
    })

    it('should import WordPressClient', () => {
      expect(content).toContain('WordPressClient')
    })

    it('should check for content_new action type', () => {
      expect(content).toContain("'content_new'")
    })

    it('should check for content_edit action type', () => {
      expect(content).toContain("'content_edit'")
    })

    it('should track approved count', () => {
      expect(content).toContain('approved')
    })

    it('should track failed count', () => {
      expect(content).toContain('failed')
    })

    it('should return errors array', () => {
      expect(content).toContain('errors')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Rollback Route ─────────────────────────────────────────────
  describe('rollback route: app/api/content/[id]/rollback/route.ts', () => {
    const content = readFile('app/api/content/[id]/rollback/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("requireRole('org:manager')")
    })

    it('should import getContentById', () => {
      expect(content).toContain('getContentById')
    })

    it('should import updateContent', () => {
      expect(content).toContain('updateContent')
    })

    it('should import WordPressClient', () => {
      expect(content).toContain('WordPressClient')
    })

    it('should import from wordpress integration', () => {
      expect(content).toContain('@packages/agents/integrations/wordpress')
    })

    it('should return 404 when content not found', () => {
      expect(content).toContain('404')
    })

    it('should call unpublishPost on WordPressClient', () => {
      expect(content).toContain('unpublishPost')
    })

    it('should access rollback_data for wordpress post id', () => {
      expect(content).toContain('rollback_data')
    })

    it('should reset content status to approved', () => {
      expect(content).toContain("'approved'")
    })

    it('should clear published_url', () => {
      expect(content).toContain('published_url')
    })

    it('should clear published_at', () => {
      expect(content).toContain('published_at')
    })

    it('should set action status to rolled_back', () => {
      expect(content).toContain("'rolled_back'")
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should access cms_credentials from client', () => {
      expect(content).toContain('cms_credentials')
    })

    it('should query agent_actions for the content piece', () => {
      expect(content).toContain('agent_actions')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Queue Queries ──────────────────────────────────────────────
  describe('queue queries: packages/db/queries/queue.ts', () => {
    const content = readFile('packages/db/queries/queue.ts')

    it('should export updateQueueItem function', () => {
      expect(content).toMatch(/export async function updateQueueItem/)
    })

    it('should accept UpdateAgentActionInput', () => {
      expect(content).toContain('UpdateAgentActionInput')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
