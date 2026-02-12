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

describe('TASK-21: Google Search Console Client', () => {
  describe('file existence', () => {
    it('google-search-console integration should exist', () => {
      expect(fileExists('packages/agents/integrations/google-search-console.ts')).toBe(true)
    })
  })

  describe('GSC client: packages/agents/integrations/google-search-console.ts', () => {
    const content = readFile('packages/agents/integrations/google-search-console.ts')

    // Class export
    it('should export GSCClient class', () => {
      expect(content).toMatch(/export class GSCClient/)
    })

    // Types
    it('should define GSCQuery interface', () => {
      expect(content).toMatch(/interface GSCQuery/)
    })

    it('should define GSCPage interface', () => {
      expect(content).toMatch(/interface GSCPage/)
    })

    it('should define TrendData interface', () => {
      expect(content).toMatch(/interface TrendData/)
    })

    // GSCQuery fields
    it('should include clicks field', () => {
      expect(content).toContain('clicks')
    })

    it('should include impressions field', () => {
      expect(content).toContain('impressions')
    })

    it('should include ctr field', () => {
      expect(content).toContain('ctr')
    })

    it('should include position field', () => {
      expect(content).toContain('position')
    })

    // API endpoints
    it('should use Search Analytics API', () => {
      expect(content).toContain('googleapis.com/webmasters/v3/sites')
    })

    it('should use searchAnalytics/query endpoint', () => {
      expect(content).toContain('searchAnalytics/query')
    })

    // Methods
    it('should have getTopQueries method', () => {
      expect(content).toMatch(/async getTopQueries/)
    })

    it('should use query dimension', () => {
      expect(content).toContain("'query'")
    })

    it('should have getTopPages method', () => {
      expect(content).toMatch(/async getTopPages/)
    })

    it('should use page dimension', () => {
      expect(content).toContain("'page'")
    })

    it('should have getQueryTrends method', () => {
      expect(content).toMatch(/async getQueryTrends/)
    })

    it('should have getSiteList method', () => {
      expect(content).toMatch(/async getSiteList/)
    })

    // Token handling
    it('should import refreshTokenIfNeeded', () => {
      expect(content).toContain('refreshTokenIfNeeded')
    })

    it('should import GoogleTokens type', () => {
      expect(content).toContain('GoogleTokens')
    })

    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    // Request params
    it('should accept siteUrl parameter', () => {
      expect(content).toContain('siteUrl')
    })

    it('should accept startDate parameter', () => {
      expect(content).toContain('startDate')
    })

    it('should accept endDate parameter', () => {
      expect(content).toContain('endDate')
    })

    it('should accept rowLimit parameter', () => {
      expect(content).toContain('rowLimit')
    })

    // Error handling
    it('should handle 401 errors', () => {
      expect(content).toContain('401')
    })

    it('should handle 403 errors', () => {
      expect(content).toContain('403')
    })

    it('should use Authorization Bearer header', () => {
      expect(content).toContain('Bearer')
    })

    // Type exports
    it('should export GSCQuery type', () => {
      expect(content).toMatch(/export.*GSCQuery/)
    })

    it('should export GSCPage type', () => {
      expect(content).toMatch(/export.*GSCPage/)
    })

    it('should export TrendData type', () => {
      expect(content).toMatch(/export.*TrendData/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
