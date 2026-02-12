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

describe('TASK-18: Onboarding - Complete', () => {
  describe('file existence', () => {
    it('complete route should exist', () => {
      expect(fileExists('app/api/onboarding/complete/route.ts')).toBe(true)
    })

    it('welcome email template should exist', () => {
      expect(fileExists('packages/audit-engine/emails/welcome.tsx')).toBe(true)
    })
  })

  describe('welcome email: packages/audit-engine/emails/welcome.tsx', () => {
    const content = readFile('packages/audit-engine/emails/welcome.tsx')

    it('should export WelcomeEmail function', () => {
      expect(content).toMatch(/export function WelcomeEmail/)
    })

    it('should define WelcomeEmailProps interface', () => {
      expect(content).toMatch(/interface WelcomeEmailProps/)
    })

    it('should accept practiceName prop', () => {
      expect(content).toContain('practiceName')
    })

    it('should accept dashboardUrl prop', () => {
      expect(content).toContain('dashboardUrl')
    })

    it('should import from @react-email/components', () => {
      expect(content).toContain('@react-email/components')
    })

    it('should include Html component', () => {
      expect(content).toContain('Html')
    })

    it('should include Button component', () => {
      expect(content).toContain('Button')
    })

    it('should include Preview component', () => {
      expect(content).toContain('Preview')
    })

    it('should include welcome message', () => {
      expect(content).toContain('Welcome to Zintas AI')
    })

    it('should mention keywords research', () => {
      expect(content).toContain('keywords')
    })

    it('should mention competitors analysis', () => {
      expect(content).toContain('competitors')
    })

    it('should mention content writing', () => {
      expect(content).toContain('content')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('route: app/api/onboarding/complete/route.ts', () => {
    const content = readFile('app/api/onboarding/complete/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should call requireAuth', () => {
      expect(content).toContain('requireAuth')
    })

    it('should validate with Zod', () => {
      expect(content).toContain('z.object')
    })

    it('should accept clientId field', () => {
      expect(content).toContain('clientId')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import updateClient', () => {
      expect(content).toContain('updateClient')
    })

    it('should import createRun', () => {
      expect(content).toContain('createRun')
    })

    it('should check practice_profile', () => {
      expect(content).toContain('practice_profile')
    })

    it('should check competitors requirement', () => {
      expect(content).toContain('competitors')
    })

    it('should check google_tokens', () => {
      expect(content).toContain('google_tokens')
    })

    it('should check for encrypted tokens', () => {
      expect(content).toContain('encrypted')
    })

    it('should check for skipped tokens', () => {
      expect(content).toContain('skipped')
    })

    it('should set onboarding_step', () => {
      expect(content).toContain('onboarding_step')
    })

    it('should set onboarding_completed_at', () => {
      expect(content).toContain('onboarding_completed_at')
    })

    it('should create agent run with onboarding trigger', () => {
      expect(content).toContain('onboarding')
    })

    it('should set agent to conductor', () => {
      expect(content).toContain("'conductor'")
    })

    it('should import Resend for email', () => {
      expect(content).toContain('Resend')
    })

    it('should import WelcomeEmail', () => {
      expect(content).toContain('WelcomeEmail')
    })

    it('should import from welcome email path', () => {
      expect(content).toContain('audit-engine/emails/welcome')
    })

    it('should use RESEND_API_KEY', () => {
      expect(content).toContain('RESEND_API_KEY')
    })

    it('should import clerkClient', () => {
      expect(content).toContain('clerkClient')
    })

    it('should get user for email', () => {
      expect(content).toContain('getUser')
    })

    it('should return redirectTo', () => {
      expect(content).toContain('redirectTo')
    })

    it('should redirect to practice dashboard', () => {
      expect(content).toContain('/practice/dashboard')
    })

    it('should return success true', () => {
      expect(content).toContain('success: true')
    })

    it('should handle ZodError', () => {
      expect(content).toContain('ZodError')
    })

    it('should return 400 for incomplete onboarding', () => {
      expect(content).toContain('400')
    })

    it('should return 404 for missing client', () => {
      expect(content).toContain('404')
    })

    it('should return 500 for server errors', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
