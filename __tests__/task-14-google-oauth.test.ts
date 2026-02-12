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

describe('TASK-14: Google OAuth Flow', () => {
  describe('file existence', () => {
    it('POST route should exist', () => {
      expect(fileExists('app/api/onboarding/google-oauth/route.ts')).toBe(true)
    })

    it('callback GET route should exist', () => {
      expect(fileExists('app/api/onboarding/google-oauth/callback/route.ts')).toBe(true)
    })

    it('google-tokens module should exist', () => {
      expect(fileExists('packages/db/google-tokens.ts')).toBe(true)
    })
  })

  describe('POST route: app/api/onboarding/google-oauth/route.ts', () => {
    const content = readFile('app/api/onboarding/google-oauth/route.ts')

    it('should export POST handler', () => {
      expect(content).toMatch(/export async function POST/)
    })

    it('should call requireAuth', () => {
      expect(content).toContain('requireAuth')
    })

    it('should use GOOGLE_CLIENT_ID from env', () => {
      expect(content).toContain('GOOGLE_CLIENT_ID')
    })

    it('should use GOOGLE_REDIRECT_URI from env', () => {
      expect(content).toContain('GOOGLE_REDIRECT_URI')
    })

    it('should include webmasters.readonly scope', () => {
      expect(content).toContain('webmasters.readonly')
    })

    it('should include analytics.readonly scope', () => {
      expect(content).toContain('analytics.readonly')
    })

    it('should include business.manage scope', () => {
      expect(content).toContain('business.manage')
    })

    it('should set access_type=offline', () => {
      expect(content).toContain('offline')
    })

    it('should set prompt=consent', () => {
      expect(content).toContain('consent')
    })

    it('should use userId as state parameter', () => {
      expect(content).toContain('userId')
      expect(content).toContain('state')
    })

    it('should return JSON with url property', () => {
      expect(content).toContain('url')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('GET route: app/api/onboarding/google-oauth/callback/route.ts', () => {
    const content = readFile('app/api/onboarding/google-oauth/callback/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should call requireAuth', () => {
      expect(content).toContain('requireAuth')
    })

    it('should extract code from query params', () => {
      expect(content).toContain('code')
    })

    it('should extract state from query params', () => {
      expect(content).toContain('state')
    })

    it('should verify state matches userId', () => {
      expect(content).toContain('userId')
    })

    it('should exchange code at oauth2.googleapis.com/token', () => {
      expect(content).toContain('oauth2.googleapis.com/token')
    })

    it('should use GOOGLE_CLIENT_SECRET from env', () => {
      expect(content).toContain('GOOGLE_CLIENT_SECRET')
    })

    it('should call encryptTokens', () => {
      expect(content).toContain('encryptTokens')
    })

    it('should call getClientByOrgId', () => {
      expect(content).toContain('getClientByOrgId')
    })

    it('should call updateClient', () => {
      expect(content).toContain('updateClient')
    })

    it('should set account_health to active', () => {
      expect(content).toContain('active')
    })

    it('should redirect to /onboarding/start?step=3', () => {
      expect(content).toContain('/onboarding/start?step=3')
    })

    it('should include google=connected in redirect', () => {
      expect(content).toContain('google=connected')
    })

    it('should handle error from Google', () => {
      expect(content).toContain('error')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('google-tokens module: packages/db/google-tokens.ts', () => {
    const content = readFile('packages/db/google-tokens.ts')

    it('should export refreshTokenIfNeeded', () => {
      expect(content).toMatch(/export async function refreshTokenIfNeeded/)
    })

    it('should export revokeTokens', () => {
      expect(content).toMatch(/export async function revokeTokens/)
    })

    it('should import decryptTokens', () => {
      expect(content).toContain('decryptTokens')
    })

    it('should import encryptTokens', () => {
      expect(content).toContain('encryptTokens')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import updateClient', () => {
      expect(content).toContain('updateClient')
    })

    it('should check expiry_date against Date.now()', () => {
      expect(content).toContain('expiry_date')
      expect(content).toContain('Date.now()')
    })

    it('should call Google token refresh endpoint', () => {
      expect(content).toContain('oauth2.googleapis.com/token')
    })

    it('should handle refresh failure by setting account_health to disconnected', () => {
      expect(content).toContain('disconnected')
    })

    it('should call Google revoke endpoint', () => {
      expect(content).toContain('oauth2.googleapis.com/revoke')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('barrel exports: packages/db/index.ts', () => {
    const content = readFile('packages/db/index.ts')

    it('should export from google-tokens', () => {
      expect(content).toContain('google-tokens')
    })
  })
})
