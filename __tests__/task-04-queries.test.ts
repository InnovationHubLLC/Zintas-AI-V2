import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const QUERIES_DIR = path.resolve(PROJECT_ROOT, 'packages/db/queries')

describe('TASK-04: Database Query Layer', () => {
  describe('File existence', () => {
    const files = [
      'clients.ts',
      'content.ts',
      'keywords.ts',
      'queue.ts',
      'leads.ts',
      'gbp-posts.ts',
      'agent-runs.ts',
      'index.ts',
    ]

    files.forEach((file) => {
      it(`should have ${file}`, () => {
        expect(fs.existsSync(path.resolve(QUERIES_DIR, file))).toBe(true)
      })
    })
  })

  describe('clients.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'clients.ts'), 'utf-8')
    })

    const functions = [
      'getClientByOrgId',
      'getClientById',
      'getAllClients',
      'createClient',
      'updateClient',
      'updateClientHealth',
    ]

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('content.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'content.ts'), 'utf-8')
    })

    const functions = [
      'getContentByClient',
      'getContentById',
      'createContent',
      'updateContent',
      'publishContent',
    ]

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should import from @packages/db/types not @packages/db', () => {
      expect(content).toContain('@packages/db/types')
    })
  })

  describe('keywords.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'keywords.ts'), 'utf-8')
    })

    const functions = [
      'getKeywordsByClient',
      'upsertKeyword',
      'bulkUpsertKeywords',
      'getKeywordTrends',
    ]

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('queue.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'queue.ts'), 'utf-8')
    })

    const functions = [
      'getQueueItems',
      'getQueueItemById',
      'approveQueueItem',
      'rejectQueueItem',
      'bulkApprove',
      'getPendingCount',
    ]

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should use supabaseAdmin for getPendingCount', () => {
      expect(content).toContain('supabaseAdmin')
    })
  })

  describe('leads.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'leads.ts'), 'utf-8')
    })

    const functions = ['createLead', 'getLeads', 'markLeadConverted']

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should use supabaseAdmin (leads table has no RLS)', () => {
      expect(content).toContain('supabaseAdmin')
    })

    it('should NOT use supabaseServer (leads table has no RLS)', () => {
      expect(content).not.toContain('supabaseServer')
    })
  })

  describe('gbp-posts.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'gbp-posts.ts'), 'utf-8')
    })

    const functions = [
      'getGbpPosts',
      'createGbpPost',
      'updateGbpPost',
      'getScheduledPosts',
    ]

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should use supabaseAdmin for getScheduledPosts', () => {
      expect(content).toContain('supabaseAdmin')
    })
  })

  describe('agent-runs.ts exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'agent-runs.ts'), 'utf-8')
    })

    const functions = ['createRun', 'updateRun', 'getRunsByClient', 'getActiveRuns']

    functions.forEach((fn) => {
      it(`should export ${fn}`, () => {
        expect(content).toMatch(new RegExp(`export async function ${fn}`))
      })
    })

    it('should not contain any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should use supabaseAdmin for admin operations', () => {
      expect(content).toContain('supabaseAdmin')
    })
  })

  describe('index.ts barrel exports', () => {
    let content: string
    beforeAll(() => {
      content = fs.readFileSync(path.resolve(QUERIES_DIR, 'index.ts'), 'utf-8')
    })

    const modules = [
      'clients',
      'content',
      'keywords',
      'queue',
      'leads',
      'gbp-posts',
      'agent-runs',
    ]

    modules.forEach((mod) => {
      it(`should re-export from ./${mod}`, () => {
        expect(content).toContain(`'./${mod}'`)
      })
    })
  })
})
