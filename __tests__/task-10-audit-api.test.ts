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

describe('TASK-10: Audit API Route (Wired)', () => {
  describe('file existence', () => {
    it('POST route should exist', () => {
      expect(fileExists('app/api/audit/free/route.ts')).toBe(true)
    })

    it('GET route should exist', () => {
      expect(fileExists('app/api/audit/free/[id]/route.ts')).toBe(true)
    })

    it('email template should exist', () => {
      expect(fileExists('packages/audit-engine/emails/audit-results.tsx')).toBe(true)
    })
  })

  describe('POST route: app/api/audit/free/route.ts', () => {
    const content = readFile('app/api/audit/free/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should import rate limiter', () => {
      expect(content).toContain('auditRateLimiter')
    })

    it('should import checkRateLimit', () => {
      expect(content).toContain('checkRateLimit')
    })

    it('should import runAudit', () => {
      expect(content).toContain('runAudit')
    })

    it('should have Zod schema with url field', () => {
      expect(content).toMatch(/url:\s*z\.string\(\)\.url/)
    })

    it('should have optional email in schema', () => {
      expect(content).toMatch(/email:\s*z\.string\(\)\.email\(\)\.optional/)
    })

    it('should have recaptchaToken in schema', () => {
      expect(content).toContain('recaptchaToken')
    })

    it('should hash IP with SHA-256', () => {
      expect(content).toContain("createHash('sha256')")
    })

    it('should import from resend for email sending', () => {
      expect(content).toContain('resend')
    })

    it('should have redaction logic for findings', () => {
      expect(content).toContain('redactFindings')
    })

    it('should call createLead', () => {
      expect(content).toContain('createLead')
    })

    it('should verify reCAPTCHA', () => {
      expect(content).toContain('verifyRecaptcha')
    })

    it('should return 429 for rate limiting', () => {
      expect(content).toContain('429')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('GET route: app/api/audit/free/[id]/route.ts', () => {
    const content = readFile('app/api/audit/free/[id]/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should use getLeadById', () => {
      expect(content).toContain('getLeadById')
    })

    it('should NOT import supabaseAdmin directly', () => {
      expect(content).not.toContain('supabaseAdmin')
    })

    it('should return 404 when lead not found', () => {
      expect(content).toContain('404')
    })

    it('should have redaction logic for findings without email', () => {
      expect(content).toContain('recommendation')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('getLeadById in queries', () => {
    it('should be exported from leads.ts', () => {
      const content = readFile('packages/db/queries/leads.ts')
      expect(content).toContain('export async function getLeadById')
    })
  })

  describe('email template', () => {
    const content = readFile('packages/audit-engine/emails/audit-results.tsx')

    it('should export AuditResultsEmail', () => {
      expect(content).toContain('export function AuditResultsEmail')
    })

    it('should import from @react-email/components', () => {
      expect(content).toContain('@react-email/components')
    })

    it('should have Zintas branding', () => {
      expect(content).toContain('Zintas AI')
    })

    it('should have score display', () => {
      expect(content).toContain('scored')
    })

    it('should have CTA button', () => {
      expect(content).toContain('Free Trial')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
