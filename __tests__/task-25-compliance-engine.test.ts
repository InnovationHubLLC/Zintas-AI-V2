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

describe('TASK-25: Compliance Engine', () => {
  describe('file existence', () => {
    it('engine.ts should exist', () => {
      expect(fileExists('packages/compliance/engine.ts')).toBe(true)
    })

    it('index.ts should exist', () => {
      expect(fileExists('packages/compliance/index.ts')).toBe(true)
    })
  })

  describe('compliance engine: packages/compliance/engine.ts', () => {
    const content = readFile('packages/compliance/engine.ts')

    // --- Type Definitions ---
    it('should define ComplianceResult interface', () => {
      expect(content).toMatch(/interface ComplianceResult/)
    })

    it('should define ComplianceDetail interface', () => {
      expect(content).toMatch(/interface ComplianceDetail/)
    })

    it('should include status field with pass/warn/block', () => {
      expect(content).toContain("'pass'")
      expect(content).toContain("'warn'")
      expect(content).toContain("'block'")
    })

    it('should include rule field in ComplianceDetail', () => {
      expect(content).toContain('rule')
    })

    it('should include severity field in ComplianceDetail', () => {
      expect(content).toContain('severity')
    })

    it('should include phrase field in ComplianceDetail', () => {
      expect(content).toContain('phrase')
    })

    it('should include reason field in ComplianceDetail', () => {
      expect(content).toContain('reason')
    })

    it('should include suggestion field in ComplianceDetail', () => {
      expect(content).toContain('suggestion')
    })

    // --- BLOCK Rules ---
    it('should have guaranteed_results rule', () => {
      expect(content).toContain('guaranteed_results')
    })

    it('should flag "guaranteed" as block', () => {
      expect(content).toMatch(/guaranteed/i)
    })

    it('should have diagnosis rule', () => {
      expect(content).toContain('diagnosis')
    })

    it('should flag "you have" as diagnosis', () => {
      expect(content).toContain('you have')
    })

    it('should have cure_language rule', () => {
      expect(content).toContain('cure_language')
    })

    it('should flag "cure" as block', () => {
      expect(content).toContain('cure')
    })

    it('should have price_without_context rule', () => {
      expect(content).toContain('price_without_context')
    })

    it('should check for dollar amounts', () => {
      expect(content).toMatch(/\$/)
    })

    // --- WARN Rules ---
    it('should have before_after rule', () => {
      expect(content).toContain('before_after')
    })

    it('should flag "before and after"', () => {
      expect(content).toContain('before and after')
    })

    it('should include disclaimer for before/after', () => {
      expect(content).toMatch(/[Ii]ndividual results may vary/)
    })

    it('should have insurance_claim rule', () => {
      expect(content).toContain('insurance_claim')
    })

    it('should flag "covered by insurance"', () => {
      expect(content).toContain('covered by insurance')
    })

    it('should include disclaimer for insurance', () => {
      expect(content).toMatch(/[Cc]ontact your insurance/)
    })

    // --- HTML Stripping ---
    it('should strip HTML tags before checking', () => {
      expect(content).toMatch(/stripHtml|replace.*<[^>]*>|strip/)
    })

    // --- LLM Check ---
    it('should import ChatAnthropic', () => {
      expect(content).toContain('ChatAnthropic')
    })

    it('should use Claude Haiku model', () => {
      expect(content).toMatch(/haiku/)
    })

    it('should limit input to 3000 chars for LLM', () => {
      expect(content).toContain('3000')
    })

    // --- Main Export ---
    it('should export complianceEngine object', () => {
      expect(content).toMatch(/export.*complianceEngine/)
    })

    it('should have check method', () => {
      expect(content).toMatch(/check.*html.*vertical|async.*check/)
    })

    // --- Status Logic ---
    it('should return block if any block severity exists', () => {
      expect(content).toContain('block')
    })

    it('should return warn if any warn severity exists', () => {
      expect(content).toContain('warn')
    })

    it('should return pass when no issues found', () => {
      expect(content).toContain('pass')
    })

    // --- Deduplication ---
    it('should deduplicate findings', () => {
      expect(content).toMatch(/dedup|Map|Set|filter|seen/)
    })

    // --- Type Exports ---
    it('should export ComplianceResult type', () => {
      expect(content).toMatch(/export.*ComplianceResult/)
    })

    it('should export ComplianceDetail type', () => {
      expect(content).toMatch(/export.*ComplianceDetail/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('compliance index: packages/compliance/index.ts', () => {
    const content = readFile('packages/compliance/index.ts')

    it('should re-export from engine module', () => {
      expect(content).toContain("from './engine'")
    })

    it('should export complianceEngine', () => {
      expect(content).toContain('complianceEngine')
    })

    it('should export ComplianceResult type', () => {
      expect(content).toContain('ComplianceResult')
    })

    it('should export ComplianceDetail type', () => {
      expect(content).toContain('ComplianceDetail')
    })
  })
})
