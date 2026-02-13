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

describe('TASK-33: Practice Intelligence Population', () => {
  describe('file existence', () => {
    it('practice-intelligence.ts should exist', () => {
      expect(fileExists('packages/agents/practice-intelligence.ts')).toBe(true)
    })

    it('populate route should exist', () => {
      expect(fileExists('app/api/practice/profile/populate/route.ts')).toBe(true)
    })
  })

  // ── Practice Intelligence Service ──────────────────────────
  describe('practice-intelligence: packages/agents/practice-intelligence.ts', () => {
    const content = readFile('packages/agents/practice-intelligence.ts')

    // Main export
    it('should export populatePracticeProfile function', () => {
      expect(content).toMatch(/export async function populatePracticeProfile/)
    })

    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    // PracticeProfile type
    it('should define PracticeProfile interface', () => {
      expect(content).toMatch(/interface PracticeProfile/)
    })

    it('should include doctors array', () => {
      expect(content).toContain('doctors')
    })

    it('should include services array', () => {
      expect(content).toContain('services')
    })

    it('should include locations array', () => {
      expect(content).toContain('locations')
    })

    // Doctor type
    it('should define Doctor interface', () => {
      expect(content).toMatch(/interface Doctor/)
    })

    it('should include npi field', () => {
      expect(content).toContain('npi')
    })

    it('should include credentials/title field', () => {
      expect(content).toMatch(/title|credentials/)
    })

    // Website crawling
    it('should fetch practice website', () => {
      expect(content).toContain('fetch')
    })

    it('should check common dental pages', () => {
      expect(content).toContain('/about')
    })

    it('should check services page', () => {
      expect(content).toContain('/services')
    })

    // Claude extraction
    it('should use ChatAnthropic for extraction', () => {
      expect(content).toContain('ChatAnthropic')
    })

    it('should import from @langchain/anthropic', () => {
      expect(content).toContain('@langchain/anthropic')
    })

    it('should parse JSON response', () => {
      expect(content).toContain('JSON.parse')
    })

    // NPI verification
    it('should query NPPES NPI Registry', () => {
      expect(content).toContain('npiregistry.cms.hhs.gov')
    })

    it('should verify doctor NPI numbers', () => {
      expect(content).toContain('npi')
    })

    // Data merging
    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import updateClient', () => {
      expect(content).toContain('updateClient')
    })

    it('should merge with existing profile data', () => {
      expect(content).toMatch(/existing|merge/i)
    })

    // Agent action
    it('should create agent action record', () => {
      expect(content).toContain('agent_actions')
    })

    it('should import supabaseAdmin', () => {
      expect(content).toContain('supabaseAdmin')
    })

    // Error handling
    it('should handle fetch errors', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    // Type exports
    it('should export PracticeProfile type', () => {
      expect(content).toContain('export')
      expect(content).toContain('PracticeProfile')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Populate API Route ─────────────────────────────────────
  describe('populate route: app/api/practice/profile/populate/route.ts', () => {
    const content = readFile('app/api/practice/profile/populate/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should require manager role', () => {
      expect(content).toContain("requireRole('org:manager')")
    })

    it('should accept clientId in request body', () => {
      expect(content).toContain('clientId')
    })

    it('should call populatePracticeProfile', () => {
      expect(content).toContain('populatePracticeProfile')
    })

    it('should return the populated profile', () => {
      expect(content).toContain('NextResponse.json')
    })

    it('should handle errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
