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

describe('TASK-31: GBP Integration Service', () => {
  describe('file existence', () => {
    it('gbp-service.ts should exist', () => {
      expect(fileExists('packages/local-seo/gbp-service.ts')).toBe(true)
    })

    it('local-seo index.ts should exist', () => {
      expect(fileExists('packages/local-seo/index.ts')).toBe(true)
    })
  })

  describe('gbp-service: packages/local-seo/gbp-service.ts', () => {
    const content = readFile('packages/local-seo/gbp-service.ts')

    // Class export
    it('should export GBPService class', () => {
      expect(content).toMatch(/export class GBPService/)
    })

    // Constructor
    it('should accept clientId in constructor', () => {
      expect(content).toContain('clientId')
    })

    // Token management
    it('should import refreshTokenIfNeeded', () => {
      expect(content).toContain('refreshTokenIfNeeded')
    })

    it('should import GoogleTokens type', () => {
      expect(content).toContain('GoogleTokens')
    })

    it('should have private getTokens method', () => {
      expect(content).toMatch(/private async getTokens/)
    })

    // Auth
    it('should use Bearer token auth', () => {
      expect(content).toContain('Bearer')
    })

    // Private request method with retry
    it('should have private request method', () => {
      expect(content).toMatch(/private async request/)
    })

    it('should handle 401 with token refresh retry', () => {
      expect(content).toContain('401')
    })

    it('should handle 403 access denied', () => {
      expect(content).toContain('403')
    })

    // API base URL
    it('should use mybusinessbusinessinformation.googleapis.com', () => {
      expect(content).toContain('googleapis.com')
    })

    // ── Methods ──────────────────────────────────────────────
    it('should have getLocations method', () => {
      expect(content).toMatch(/async getLocations/)
    })

    it('should have createPost method', () => {
      expect(content).toMatch(/async createPost/)
    })

    it('should have getReviews method', () => {
      expect(content).toMatch(/async getReviews/)
    })

    it('should have generateReviewResponse method', () => {
      expect(content).toMatch(/async generateReviewResponse/)
    })

    it('should have getInsights method', () => {
      expect(content).toMatch(/async getInsights/)
    })

    it('should have suggestCategoryOptimizations method', () => {
      expect(content).toMatch(/async suggestCategoryOptimizations/)
    })

    // ── Type definitions ─────────────────────────────────────
    it('should define GBPLocation interface', () => {
      expect(content).toMatch(/interface GBPLocation/)
    })

    it('should define GBPPostInput interface', () => {
      expect(content).toMatch(/interface GBPPostInput/)
    })

    it('should define GBPPostResult interface', () => {
      expect(content).toMatch(/interface GBPPostResult/)
    })

    it('should define GBPReview interface', () => {
      expect(content).toMatch(/interface GBPReview/)
    })

    it('should define GBPInsights interface', () => {
      expect(content).toMatch(/interface GBPInsights/)
    })

    it('should define CategorySuggestion interface', () => {
      expect(content).toMatch(/interface CategorySuggestion/)
    })

    // ── GBPLocation fields ───────────────────────────────────
    it('should include locationId in GBPLocation', () => {
      expect(content).toContain('locationId')
    })

    it('should include websiteUrl in GBPLocation', () => {
      expect(content).toContain('websiteUrl')
    })

    // ── GBPPostInput fields ──────────────────────────────────
    it('should include body in GBPPostInput', () => {
      expect(content).toContain('body')
    })

    it('should include topicType STANDARD', () => {
      expect(content).toContain("'STANDARD'")
    })

    it('should include topicType OFFER', () => {
      expect(content).toContain("'OFFER'")
    })

    it('should include topicType EVENT', () => {
      expect(content).toContain("'EVENT'")
    })

    it('should include callToAction field', () => {
      expect(content).toContain('callToAction')
    })

    it('should include mediaUrl field', () => {
      expect(content).toContain('mediaUrl')
    })

    // ── GBPReview fields ─────────────────────────────────────
    it('should include rating in GBPReview', () => {
      expect(content).toContain('rating')
    })

    it('should include comment in GBPReview', () => {
      expect(content).toContain('comment')
    })

    it('should include reviewReply in GBPReview', () => {
      expect(content).toContain('reviewReply')
    })

    // ── GBPInsights fields ───────────────────────────────────
    it('should include views in GBPInsights', () => {
      expect(content).toContain('views')
    })

    it('should include searches in GBPInsights', () => {
      expect(content).toContain('searches')
    })

    it('should include websiteClicks in GBPInsights', () => {
      expect(content).toContain('websiteClicks')
    })

    // ── Review response logic ────────────────────────────────
    it('should use ChatAnthropic for review responses', () => {
      expect(content).toContain('ChatAnthropic')
    })

    it('should import from @langchain/anthropic', () => {
      expect(content).toContain('@langchain/anthropic')
    })

    it('should mention 150 words limit', () => {
      expect(content).toContain('150')
    })

    // ── Category suggestions ─────────────────────────────────
    it('should include dental category suggestions', () => {
      expect(content).toMatch(/dental|dentist/i)
    })

    // ── Error handling ───────────────────────────────────────
    it('should handle errors with try-catch', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    // ── Type exports ─────────────────────────────────────────
    it('should export GBPLocation type', () => {
      expect(content).toContain('GBPLocation')
      expect(content).toContain('export type')
    })

    it('should export GBPPostInput type', () => {
      expect(content).toContain('GBPPostInput')
      expect(content).toContain('export type')
    })

    it('should export GBPReview type', () => {
      expect(content).toContain('GBPReview')
      expect(content).toContain('export type')
    })

    it('should export GBPInsights type', () => {
      expect(content).toContain('GBPInsights')
      expect(content).toContain('export type')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('local-seo index: packages/local-seo/index.ts', () => {
    const content = readFile('packages/local-seo/index.ts')

    it('should export GBPService', () => {
      expect(content).toContain('GBPService')
    })

    it('should re-export from gbp-service', () => {
      expect(content).toContain("from './gbp-service'")
    })
  })
})
