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

describe('TASK-17: Onboarding - Competitor Suggestions', () => {
  describe('file existence', () => {
    it('competitor-finder module should exist', () => {
      expect(fileExists('packages/audit-engine/competitor-finder.ts')).toBe(true)
    })

    it('competitors route should exist', () => {
      expect(fileExists('app/api/onboarding/competitors/route.ts')).toBe(true)
    })
  })

  describe('competitor-finder module: packages/audit-engine/competitor-finder.ts', () => {
    const content = readFile('packages/audit-engine/competitor-finder.ts')

    it('should export findCompetitors function', () => {
      expect(content).toMatch(/export async function findCompetitors/)
    })

    it('should accept location parameter', () => {
      expect(content).toContain('location')
    })

    it('should accept vertical parameter', () => {
      expect(content).toContain('vertical')
    })

    it('should accept excludeDomain parameter', () => {
      expect(content).toContain('excludeDomain')
    })

    it('should return Competitor array', () => {
      expect(content).toContain('Competitor')
    })

    it('should define Competitor interface', () => {
      expect(content).toMatch(/interface Competitor/)
    })

    it('should include name in Competitor', () => {
      expect(content).toContain('name')
    })

    it('should include domain in Competitor', () => {
      expect(content).toContain('domain')
    })

    it('should include address in Competitor', () => {
      expect(content).toContain('address')
    })

    it('should include placeId in Competitor', () => {
      expect(content).toContain('placeId')
    })

    it('should use Google Places Text Search API', () => {
      expect(content).toContain('places.googleapis.com/v1/places:searchText')
    })

    it('should use GOOGLE_PLACES_API_KEY env var', () => {
      expect(content).toContain('GOOGLE_PLACES_API_KEY')
    })

    it('should set X-Goog-Api-Key header', () => {
      expect(content).toContain('X-Goog-Api-Key')
    })

    it('should set X-Goog-FieldMask header', () => {
      expect(content).toContain('X-Goog-FieldMask')
    })

    it('should request displayName field', () => {
      expect(content).toContain('displayName')
    })

    it('should request websiteUri field', () => {
      expect(content).toContain('websiteUri')
    })

    it('should request formattedAddress field', () => {
      expect(content).toContain('formattedAddress')
    })

    it('should build query with textQuery', () => {
      expect(content).toContain('textQuery')
    })

    it('should limit results to 5', () => {
      expect(content).toContain('5')
    })

    it('should use AbortController for timeout', () => {
      expect(content).toContain('AbortController')
    })

    it('should use ZintasBot User-Agent', () => {
      expect(content).toContain('ZintasBot')
    })

    it('should check for SE_RANKING_API_KEY', () => {
      expect(content).toContain('SE_RANKING_API_KEY')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('route: app/api/onboarding/competitors/route.ts', () => {
    const content = readFile('app/api/onboarding/competitors/route.ts')

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

    it('should accept location field', () => {
      expect(content).toContain('location')
    })

    it('should accept vertical field', () => {
      expect(content).toContain('vertical')
    })

    it('should import findCompetitors', () => {
      expect(content).toContain('findCompetitors')
    })

    it('should import from competitor-finder', () => {
      expect(content).toContain('competitor-finder')
    })

    it('should handle suggest action', () => {
      expect(content).toContain('suggest')
    })

    it('should handle finalize action', () => {
      expect(content).toContain('finalize')
    })

    it('should import getClientById', () => {
      expect(content).toContain('getClientById')
    })

    it('should import updateClient', () => {
      expect(content).toContain('updateClient')
    })

    it('should return competitors in response', () => {
      expect(content).toContain('competitors')
    })

    it('should set onboarding_step on finalize', () => {
      expect(content).toContain('onboarding_step')
    })

    it('should handle ZodError', () => {
      expect(content).toContain('ZodError')
    })

    it('should return 400 for validation errors', () => {
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

  describe('barrel exports: packages/audit-engine/index.ts', () => {
    const content = readFile('packages/audit-engine/index.ts')

    it('should export findCompetitors', () => {
      expect(content).toContain('findCompetitors')
    })

    it('should export Competitor type', () => {
      expect(content).toContain('Competitor')
    })
  })
})
