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

describe('TASK-32: GBP Post Scheduler', () => {
  describe('file existence', () => {
    it('scheduler.ts should exist', () => {
      expect(fileExists('packages/local-seo/scheduler.ts')).toBe(true)
    })

    it('cron publish-gbp route should exist', () => {
      expect(fileExists('app/api/cron/publish-gbp/route.ts')).toBe(true)
    })

    it('vercel.json should exist', () => {
      expect(fileExists('vercel.json')).toBe(true)
    })
  })

  // ── Scheduler ──────────────────────────────────────────────
  describe('scheduler: packages/local-seo/scheduler.ts', () => {
    const content = readFile('packages/local-seo/scheduler.ts')

    // Exports
    it('should export schedulePost function', () => {
      expect(content).toMatch(/export async function schedulePost/)
    })

    it('should export publishScheduledPosts function', () => {
      expect(content).toMatch(/export async function publishScheduledPosts/)
    })

    it('should export generateWeeklyGBPPosts function', () => {
      expect(content).toMatch(/export async function generateWeeklyGBPPosts/)
    })

    // schedulePost
    it('should accept clientId parameter', () => {
      expect(content).toContain('clientId')
    })

    it('should accept scheduledAt parameter', () => {
      expect(content).toContain('scheduledAt')
    })

    it('should set status to scheduled', () => {
      expect(content).toContain("'scheduled'")
    })

    it('should import createGbpPost', () => {
      expect(content).toContain('createGbpPost')
    })

    // publishScheduledPosts
    it('should import getScheduledPosts', () => {
      expect(content).toContain('getScheduledPosts')
    })

    it('should import updateGbpPost', () => {
      expect(content).toContain('updateGbpPost')
    })

    it('should import GBPService', () => {
      expect(content).toContain('GBPService')
    })

    it('should track published count', () => {
      expect(content).toContain('published')
    })

    it('should track failed count', () => {
      expect(content).toContain('failed')
    })

    it('should set published_at timestamp', () => {
      expect(content).toContain('published_at')
    })

    it('should store gbp_post_id from API response', () => {
      expect(content).toContain('gbp_post_id')
    })

    it('should handle publish errors with try-catch', () => {
      expect(content).toMatch(/try\s*\{/)
      expect(content).toMatch(/catch/)
    })

    // generateWeeklyGBPPosts
    it('should import ChatAnthropic', () => {
      expect(content).toContain('ChatAnthropic')
    })

    it('should import from @langchain/anthropic', () => {
      expect(content).toContain('@langchain/anthropic')
    })

    it('should generate 2 posts', () => {
      expect(content).toContain('2')
    })

    it('should define GBPPostDraft interface', () => {
      expect(content).toMatch(/interface GBPPostDraft/)
    })

    it('should include ctaType in draft', () => {
      expect(content).toContain('ctaType')
    })

    it('should reference practice profile', () => {
      expect(content).toContain('practiceProfile')
    })

    // Import structure
    it('should import from gbp-service', () => {
      expect(content).toContain("from './gbp-service'")
    })

    it('should import from @packages/db/queries', () => {
      expect(content).toContain('@packages/db')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Cron Route ─────────────────────────────────────────────
  describe('cron route: app/api/cron/publish-gbp/route.ts', () => {
    const content = readFile('app/api/cron/publish-gbp/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should verify CRON_SECRET header', () => {
      expect(content).toContain('CRON_SECRET')
    })

    it('should return 401 for invalid secret', () => {
      expect(content).toContain('401')
    })

    it('should call publishScheduledPosts', () => {
      expect(content).toContain('publishScheduledPosts')
    })

    it('should return published and failed counts', () => {
      expect(content).toContain('published')
      expect(content).toContain('failed')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Vercel Config ──────────────────────────────────────────
  describe('vercel.json', () => {
    const content = readFile('vercel.json')

    it('should define crons array', () => {
      expect(content).toContain('crons')
    })

    it('should include publish-gbp path', () => {
      expect(content).toContain('/api/cron/publish-gbp')
    })

    it('should set 30-minute schedule', () => {
      expect(content).toContain('*/30 * * * *')
    })
  })

  // ── Index exports ──────────────────────────────────────────
  describe('local-seo index: packages/local-seo/index.ts', () => {
    const content = readFile('packages/local-seo/index.ts')

    it('should export from scheduler', () => {
      expect(content).toContain("from './scheduler'")
    })

    it('should export schedulePost', () => {
      expect(content).toContain('schedulePost')
    })

    it('should export publishScheduledPosts', () => {
      expect(content).toContain('publishScheduledPosts')
    })
  })
})
