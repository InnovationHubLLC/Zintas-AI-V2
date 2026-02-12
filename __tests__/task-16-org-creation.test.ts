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

describe('TASK-16: Onboarding - Org Creation', () => {
  describe('file existence', () => {
    it('create-org route should exist', () => {
      expect(fileExists('app/api/onboarding/create-org/route.ts')).toBe(true)
    })

    it('clients query module should exist', () => {
      expect(fileExists('packages/db/queries/clients.ts')).toBe(true)
    })
  })

  describe('route: app/api/onboarding/create-org/route.ts', () => {
    const content = readFile('app/api/onboarding/create-org/route.ts')

    // POST handler
    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    // Zod validation
    it('should validate with Zod', () => {
      expect(content).toContain('z.object')
    })

    it('should accept practiceName field', () => {
      expect(content).toContain('practiceName')
    })

    it('should accept domain field', () => {
      expect(content).toContain('domain')
    })

    it('should accept vertical field', () => {
      expect(content).toContain('vertical')
    })

    it('should accept address field', () => {
      expect(content).toContain('address')
    })

    it('should accept managementMode field', () => {
      expect(content).toContain('managementMode')
    })

    it('should support managed mode', () => {
      expect(content).toContain("'managed'")
    })

    it('should support self_service mode', () => {
      expect(content).toContain("'self_service'")
    })

    // Auth
    it('should call requireAuth', () => {
      expect(content).toContain('requireAuth')
    })

    // Clerk org creation
    it('should import clerkClient', () => {
      expect(content).toContain('clerkClient')
    })

    it('should create Clerk organization', () => {
      expect(content).toContain('createOrganization')
    })

    it('should pass userId as createdBy', () => {
      expect(content).toContain('createdBy')
    })

    it('should create organization membership', () => {
      expect(content).toContain('createOrganizationMembership')
    })

    it('should assign practice_owner role', () => {
      expect(content).toContain('practice_owner')
    })

    // Duplicate domain check
    it('should check for duplicate domain', () => {
      expect(content).toContain('getClientByDomain')
    })

    it('should return 409 for duplicate domain', () => {
      expect(content).toContain('409')
    })

    it('should return Practice already registered message', () => {
      expect(content).toContain('Practice already registered')
    })

    // Client creation
    it('should call createClient', () => {
      expect(content).toContain('createClient')
    })

    it('should set onboarding_step', () => {
      expect(content).toContain('onboarding_step')
    })

    it('should set practice_profile', () => {
      expect(content).toContain('practice_profile')
    })

    // CMS detection
    it('should import detectCMS', () => {
      expect(content).toContain('detectCMS')
    })

    it('should store cms_type', () => {
      expect(content).toContain('cms_type')
    })

    // Response
    it('should return orgId in response', () => {
      expect(content).toContain('orgId')
    })

    it('should return clientId in response', () => {
      expect(content).toContain('clientId')
    })

    it('should return cmsResult in response', () => {
      expect(content).toContain('cmsResult')
    })

    it('should return 201 on success', () => {
      expect(content).toContain('201')
    })

    // Error handling
    it('should handle ZodError', () => {
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

  describe('getClientByDomain: packages/db/queries/clients.ts', () => {
    const content = readFile('packages/db/queries/clients.ts')

    it('should export getClientByDomain function', () => {
      expect(content).toMatch(/export async function getClientByDomain/)
    })

    it('should query by domain field', () => {
      expect(content).toContain("'domain'")
    })

    it('should use supabaseAdmin for cross-org lookup', () => {
      expect(content).toContain('supabaseAdmin')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
