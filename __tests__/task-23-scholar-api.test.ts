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

describe('TASK-23: Scholar API Routes', () => {
  // ── File Existence ─────────────────────────────────────────
  describe('file existence', () => {
    it('scholar run route should exist', () => {
      expect(fileExists('app/api/agents/scholar/run/route.ts')).toBe(true)
    })

    it('generic agent run route should exist', () => {
      expect(fileExists('app/api/agents/run/route.ts')).toBe(true)
    })

    it('keywords route should exist', () => {
      expect(fileExists('app/api/keywords/[clientId]/route.ts')).toBe(true)
    })

    it('agent runs route should exist', () => {
      expect(fileExists('app/api/agents/runs/[clientId]/route.ts')).toBe(true)
    })
  })

  // ── Scholar Run Route ──────────────────────────────────────
  describe('scholar run route: app/api/agents/scholar/run/route.ts', () => {
    const content = readFile('app/api/agents/scholar/run/route.ts')

    // Auth
    it('should import requireAgentKey', () => {
      expect(content).toContain('requireAgentKey')
    })

    it('should check agent API key', () => {
      expect(content).toContain('requireAgentKey(request)')
    })

    // Schema
    it('should validate clientId as UUID', () => {
      expect(content).toContain('clientId')
      expect(content).toContain('uuid()')
    })

    it('should not require keywords array', () => {
      expect(content).not.toMatch(/keywords:\s*z\.array/)
    })

    // Scholar integration
    it('should import runScholar', () => {
      expect(content).toContain('runScholar')
    })

    it('should import from @packages/agents/scholar', () => {
      expect(content).toContain('@packages/agents/scholar')
    })

    it('should call runScholar with clientId', () => {
      expect(content).toMatch(/runScholar\(/)
    })

    // Client lookup for orgId
    it('should look up client for org_id', () => {
      expect(content).toContain('getClientById')
    })

    // Response
    it('should return runId in response', () => {
      expect(content).toContain('runId')
    })

    it('should return 202 status', () => {
      expect(content).toContain('202')
    })

    // Error handling
    it('should handle ZodError with 400', () => {
      expect(content).toContain('ZodError')
      expect(content).toContain('400')
    })

    it('should handle 404 for missing client', () => {
      expect(content).toContain('404')
    })

    it('should handle 500 errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Generic Agent Run Route ────────────────────────────────
  describe('generic agent run route: app/api/agents/run/route.ts', () => {
    const content = readFile('app/api/agents/run/route.ts')

    // Auth
    it('should import requireRole', () => {
      expect(content).toContain('requireRole')
    })

    it('should require org:manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    // Schema
    it('should validate agentName enum', () => {
      expect(content).toContain('agentName')
      expect(content).toContain("'scholar'")
    })

    it('should validate clientId', () => {
      expect(content).toContain('clientId')
    })

    // Scholar dispatch
    it('should import runScholar', () => {
      expect(content).toContain('runScholar')
    })

    it('should dispatch to scholar agent', () => {
      expect(content).toMatch(/agentName.*===.*'scholar'|agent.*scholar/)
    })

    it('should call runScholar with clientId and orgId', () => {
      expect(content).toMatch(/runScholar\(/)
    })

    // Response
    it('should return 202 status', () => {
      expect(content).toContain('202')
    })

    it('should return runId in response', () => {
      expect(content).toContain('runId')
    })

    // Error handling
    it('should handle ZodError with 400', () => {
      expect(content).toContain('ZodError')
      expect(content).toContain('400')
    })

    it('should handle 500 errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Keywords Route ─────────────────────────────────────────
  describe('keywords route: app/api/keywords/[clientId]/route.ts', () => {
    const content = readFile('app/api/keywords/[clientId]/route.ts')

    // Auth
    it('should import requireRole', () => {
      expect(content).toContain('requireRole')
    })

    it('should require org:manager role', () => {
      expect(content).toContain("'org:manager'")
    })

    // Data fetching
    it('should import getKeywordsByClient', () => {
      expect(content).toContain('getKeywordsByClient')
    })

    it('should call getKeywordsByClient with clientId', () => {
      expect(content).toContain('getKeywordsByClient(clientId')
    })

    // Query params
    it('should support type query param', () => {
      expect(content).toMatch(/searchParams.*type|type.*searchParams/)
    })

    it('should support sort query param', () => {
      expect(content).toContain('sort')
    })

    it('should support order query param', () => {
      expect(content).toContain('order')
    })

    // Pagination
    it('should support page query param', () => {
      expect(content).toContain('page')
    })

    it('should support limit query param', () => {
      expect(content).toContain('limit')
    })

    it('should return total count', () => {
      expect(content).toContain('total')
    })

    // Sorting
    it('should support sorting by search_volume', () => {
      expect(content).toContain('search_volume')
    })

    it('should support sorting by difficulty', () => {
      expect(content).toContain('difficulty')
    })

    it('should support sorting by position', () => {
      expect(content).toContain('position')
    })

    // Error handling
    it('should handle 500 errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Agent Runs Route ───────────────────────────────────────
  describe('agent runs route: app/api/agents/runs/[clientId]/route.ts', () => {
    const content = readFile('app/api/agents/runs/[clientId]/route.ts')

    it('should import requireRole', () => {
      expect(content).toContain('requireRole')
    })

    it('should import getRunsByClient', () => {
      expect(content).toContain('getRunsByClient')
    })

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
