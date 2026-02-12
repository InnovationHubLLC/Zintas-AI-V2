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

describe('TASK-27: WordPress Client', () => {
  describe('file existence', () => {
    it('wordpress integration should exist', () => {
      expect(fileExists('packages/agents/integrations/wordpress.ts')).toBe(true)
    })
  })

  describe('wordpress client: packages/agents/integrations/wordpress.ts', () => {
    const content = readFile('packages/agents/integrations/wordpress.ts')

    // Class export
    it('should export WordPressClient class', () => {
      expect(content).toMatch(/export class WordPressClient/)
    })

    // Type definitions
    it('should define WPPostInput interface', () => {
      expect(content).toMatch(/interface WPPostInput/)
    })

    it('should define WPPost interface', () => {
      expect(content).toMatch(/interface WPPost/)
    })

    it('should define WPCredentials interface', () => {
      expect(content).toMatch(/interface WPCredentials/)
    })

    it('should define WPPluginCheck interface', () => {
      expect(content).toMatch(/interface WPPluginCheck/)
    })

    // WPPostInput fields
    it('should include title field in post input', () => {
      expect(content).toContain('title')
    })

    it('should include content field in post input', () => {
      expect(content).toContain('content')
    })

    it('should include status field with publish/draft', () => {
      expect(content).toContain("'publish'")
      expect(content).toContain("'draft'")
    })

    it('should include slug field', () => {
      expect(content).toContain('slug')
    })

    it('should include excerpt field', () => {
      expect(content).toContain('excerpt')
    })

    it('should include meta field for SEO', () => {
      expect(content).toContain('meta')
    })

    // WPPost fields
    it('should include id in WPPost', () => {
      expect(content).toContain('id')
    })

    it('should include link in WPPost', () => {
      expect(content).toContain('link')
    })

    // WPCredentials fields
    it('should include username in credentials', () => {
      expect(content).toContain('username')
    })

    it('should include applicationPassword in credentials', () => {
      expect(content).toContain('applicationPassword')
    })

    // Constructor
    it('should accept siteUrl parameter', () => {
      expect(content).toContain('siteUrl')
    })

    it('should accept credentials parameter', () => {
      expect(content).toContain('credentials')
    })

    // Auth
    it('should use Basic auth', () => {
      expect(content).toContain('Basic')
    })

    it('should use base64 encoding for auth', () => {
      expect(content).toContain('base64')
    })

    // WordPress REST API
    it('should use wp-json/wp/v2 base path', () => {
      expect(content).toContain('wp-json/wp/v2')
    })

    it('should use wp-json/wp/v2/users/me endpoint', () => {
      expect(content).toContain('wp-json/wp/v2/users/me')
    })

    // Methods
    it('should have publishPost method', () => {
      expect(content).toMatch(/async publishPost/)
    })

    it('should have updatePost method', () => {
      expect(content).toMatch(/async updatePost/)
    })

    it('should have unpublishPost method', () => {
      expect(content).toMatch(/async unpublishPost/)
    })

    it('should have testConnection method', () => {
      expect(content).toMatch(/async testConnection/)
    })

    it('should have checkPlugins method', () => {
      expect(content).toMatch(/async checkPlugins/)
    })

    // Plugin detection
    it('should detect Yoast SEO', () => {
      expect(content).toMatch(/yoast/i)
    })

    it('should detect Rank Math', () => {
      expect(content).toMatch(/rank.?math/i)
    })

    it('should include yoast_wpseo_title meta field', () => {
      expect(content).toContain('yoast_wpseo_title')
    })

    it('should include yoast_wpseo_metadesc meta field', () => {
      expect(content).toContain('yoast_wpseo_metadesc')
    })

    it('should include rank_math_title meta field', () => {
      expect(content).toContain('rank_math_title')
    })

    it('should include rank_math_description meta field', () => {
      expect(content).toContain('rank_math_description')
    })

    // Error handling
    it('should handle 401 errors', () => {
      expect(content).toContain('401')
    })

    it('should show credentials error message', () => {
      expect(content).toMatch(/credentials.*invalid|invalid.*credentials/i)
    })

    it('should handle 403 errors', () => {
      expect(content).toContain('403')
    })

    it('should show permission error message', () => {
      expect(content).toMatch(/permission/i)
    })

    it('should handle 404 errors', () => {
      expect(content).toContain('404')
    })

    it('should show REST API not found message', () => {
      expect(content).toMatch(/REST API/i)
    })

    // unpublishPost sets status to draft
    it('should set status to draft in unpublishPost', () => {
      expect(content).toContain("'draft'")
    })

    // Type exports
    it('should export WPPostInput type', () => {
      expect(content).toMatch(/export.*WPPostInput/)
    })

    it('should export WPPost type', () => {
      expect(content).toMatch(/export.*WPPost/)
    })

    it('should export WPCredentials type', () => {
      expect(content).toMatch(/export.*WPCredentials/)
    })

    it('should export WPPluginCheck type', () => {
      expect(content).toMatch(/export.*WPPluginCheck/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
