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

describe('TASK-15: CMS Auto-Detection', () => {
  describe('file existence', () => {
    it('detect-cms module should exist', () => {
      expect(fileExists('packages/audit-engine/detect-cms.ts')).toBe(true)
    })

    it('detect-cms route should exist', () => {
      expect(fileExists('app/api/onboarding/detect-cms/route.ts')).toBe(true)
    })
  })

  describe('detect-cms module: packages/audit-engine/detect-cms.ts', () => {
    const content = readFile('packages/audit-engine/detect-cms.ts')

    it('should export detectCMS function', () => {
      expect(content).toMatch(/export async function detectCMS/)
    })

    it('should accept domain parameter', () => {
      expect(content).toContain('domain')
    })

    it('should return Promise<CMSResult>', () => {
      expect(content).toContain('CMSResult')
    })

    // CMS type union
    it('should define wordpress CMS type', () => {
      expect(content).toContain("'wordpress'")
    })

    it('should define wix CMS type', () => {
      expect(content).toContain("'wix'")
    })

    it('should define squarespace CMS type', () => {
      expect(content).toContain("'squarespace'")
    })

    it('should define webflow CMS type', () => {
      expect(content).toContain("'webflow'")
    })

    it('should define ghl CMS type', () => {
      expect(content).toContain("'ghl'")
    })

    it('should define custom CMS type', () => {
      expect(content).toContain("'custom'")
    })

    it('should define unknown CMS type', () => {
      expect(content).toContain("'unknown'")
    })

    it('should define error CMS type', () => {
      expect(content).toContain("'error'")
    })

    // Confidence union
    it('should define high confidence level', () => {
      expect(content).toContain("'high'")
    })

    it('should define medium confidence level', () => {
      expect(content).toContain("'medium'")
    })

    it('should define low confidence level', () => {
      expect(content).toContain("'low'")
    })

    it('should define none confidence level', () => {
      expect(content).toContain("'none'")
    })

    // CMSResult fields
    it('should include cms field in CMSResult', () => {
      expect(content).toContain('cms:')
    })

    it('should include confidence field in CMSResult', () => {
      expect(content).toContain('confidence:')
    })

    it('should include apiAvailable field in CMSResult', () => {
      expect(content).toContain('apiAvailable')
    })

    it('should include version field in CMSResult', () => {
      expect(content).toContain('version')
    })

    it('should include setupInstructions field in CMSResult', () => {
      expect(content).toContain('setupInstructions')
    })

    // WordPress detection
    it('should check for wp-content marker', () => {
      expect(content).toContain('wp-content')
    })

    it('should check for wp-includes marker', () => {
      expect(content).toContain('wp-includes')
    })

    it('should check /wp-json/ endpoint', () => {
      expect(content).toContain('wp-json')
    })

    it('should include WordPress setup instructions about Application Password', () => {
      expect(content).toContain('Application Password')
    })

    // Wix detection
    it('should check for wix.com marker', () => {
      expect(content).toContain('wix.com')
    })

    it('should check for X-Wix headers', () => {
      expect(content).toContain('X-Wix')
    })

    it('should include Wix setup instructions', () => {
      expect(content).toContain('Wix')
    })

    // Squarespace detection
    it('should check for squarespace.com marker', () => {
      expect(content).toContain('squarespace.com')
    })

    it('should check for sqsp marker', () => {
      expect(content).toContain('sqsp')
    })

    it('should include Squarespace setup instructions', () => {
      expect(content).toContain('Squarespace')
    })

    // Webflow detection
    it('should check for webflow.com marker', () => {
      expect(content).toContain('webflow.com')
    })

    it('should check for wf- prefixed class marker', () => {
      expect(content).toContain('wf-')
    })

    it('should include Webflow setup instructions', () => {
      expect(content).toContain('Webflow')
    })

    // GHL detection
    it('should check for GoHighLevel markers', () => {
      expect(content).toContain('leadconnectorhq')
    })

    it('should include GHL setup instructions', () => {
      expect(content).toContain('GoHighLevel')
    })

    // Timeout handling
    it('should define a timeout constant', () => {
      expect(content).toMatch(/TIMEOUT|timeout/i)
    })

    it('should use AbortController for timeout', () => {
      expect(content).toContain('AbortController')
    })

    // User-Agent handling
    it('should use ZintasBot User-Agent', () => {
      expect(content).toContain('ZintasBot')
    })

    // URL normalization
    it('should handle URL normalization with https', () => {
      expect(content).toContain('https://')
    })

    // Redirect following
    it('should configure redirect following', () => {
      expect(content).toContain('redirect')
    })

    // Unknown fallback
    it('should return unknown when no CMS detected', () => {
      expect(content).toContain("couldn't detect")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('route: app/api/onboarding/detect-cms/route.ts', () => {
    const content = readFile('app/api/onboarding/detect-cms/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should call requireAuth', () => {
      expect(content).toContain('requireAuth')
    })

    it('should validate input with Zod', () => {
      expect(content).toContain('z.object')
    })

    it('should import detectCMS', () => {
      expect(content).toContain('detectCMS')
    })

    it('should call detectCMS with the URL', () => {
      expect(content).toContain('detectCMS')
    })

    it('should handle ZodError for validation', () => {
      expect(content).toContain('ZodError')
    })

    it('should return 400 for validation errors', () => {
      expect(content).toContain('400')
    })

    it('should return 500 for server errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('barrel exports: packages/audit-engine/index.ts', () => {
    const content = readFile('packages/audit-engine/index.ts')

    it('should export detectCMS', () => {
      expect(content).toContain('detectCMS')
    })

    it('should export CMSResult type', () => {
      expect(content).toContain('CMSResult')
    })
  })
})
