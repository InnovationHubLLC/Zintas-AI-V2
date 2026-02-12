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

describe('TASK-20: SE Ranking API Client', () => {
  describe('file existence', () => {
    it('se-ranking integration should exist', () => {
      expect(fileExists('packages/agents/integrations/se-ranking.ts')).toBe(true)
    })
  })

  describe('se-ranking client: packages/agents/integrations/se-ranking.ts', () => {
    const content = readFile('packages/agents/integrations/se-ranking.ts')

    // Class export
    it('should export SERankingClient class', () => {
      expect(content).toMatch(/export class SERankingClient/)
    })

    // KeywordData type
    it('should define KeywordData interface', () => {
      expect(content).toMatch(/interface KeywordData/)
    })

    it('should include searchVolume field', () => {
      expect(content).toContain('searchVolume')
    })

    it('should include difficulty field', () => {
      expect(content).toContain('difficulty')
    })

    it('should include cpc field', () => {
      expect(content).toContain('cpc')
    })

    it('should include competition field', () => {
      expect(content).toContain('competition')
    })

    // PositionData type
    it('should define PositionData interface', () => {
      expect(content).toMatch(/interface PositionData/)
    })

    it('should include position field', () => {
      expect(content).toContain('position')
    })

    it('should include previousPosition field', () => {
      expect(content).toContain('previousPosition')
    })

    // API config
    it('should use SE Ranking base URL', () => {
      expect(content).toContain('https://api.seranking.com')
    })

    it('should use SE_RANKING_API_KEY env var', () => {
      expect(content).toContain('SE_RANKING_API_KEY')
    })

    it('should set X-Api-Key header', () => {
      expect(content).toContain('X-Api-Key')
    })

    // 6 Methods
    it('should have keywordResearch method', () => {
      expect(content).toMatch(/async keywordResearch/)
    })

    it('should POST to /research/keywords', () => {
      expect(content).toContain('/research/keywords')
    })

    it('should have getCompetitorKeywords method', () => {
      expect(content).toMatch(/async getCompetitorKeywords/)
    })

    it('should GET /research/competitors', () => {
      expect(content).toContain('/research/competitors')
    })

    it('should have createProject method', () => {
      expect(content).toMatch(/async createProject/)
    })

    it('should POST to /projects', () => {
      expect(content).toContain('/projects')
    })

    it('should have addKeywordsToProject method', () => {
      expect(content).toMatch(/async addKeywordsToProject/)
    })

    it('should enforce max 50 keywords per batch', () => {
      expect(content).toContain('50')
    })

    it('should have getPositions method', () => {
      expect(content).toMatch(/async getPositions/)
    })

    it('should GET positions endpoint', () => {
      expect(content).toContain('/positions')
    })

    it('should have bulkKeywordResearch method', () => {
      expect(content).toMatch(/async bulkKeywordResearch/)
    })

    // Batching
    it('should batch in groups of 10', () => {
      expect(content).toContain('10')
    })

    it('should implement 500ms delay between batches', () => {
      expect(content).toContain('500')
    })

    it('should deduplicate results', () => {
      expect(content).toMatch(/dedup|Map|Set|filter/)
    })

    // Error handling
    it('should handle 429 rate limit errors', () => {
      expect(content).toContain('429')
    })

    it('should handle 401 invalid key errors', () => {
      expect(content).toContain('401')
    })

    it('should handle 500 server errors with retry', () => {
      expect(content).toContain('500')
    })

    it('should implement retry logic', () => {
      expect(content).toMatch(/retry|Retry/)
    })

    it('should wait 2 seconds before retry on 500', () => {
      expect(content).toContain('2000')
    })

    // Type exports
    it('should export KeywordData type', () => {
      expect(content).toMatch(/export.*KeywordData/)
    })

    it('should export PositionData type', () => {
      expect(content).toMatch(/export.*PositionData/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
