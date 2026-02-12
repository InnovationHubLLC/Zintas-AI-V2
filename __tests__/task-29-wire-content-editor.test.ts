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

describe('TASK-29: Wire Content Editor', () => {
  describe('file existence', () => {
    it('content editor page should exist', () => {
      expect(
        fileExists('app/(manager)/dashboard/[client]/content/[id]/edit/page.tsx')
      ).toBe(true)
    })
  })

  describe('content editor: app/(manager)/dashboard/[client]/content/[id]/edit/page.tsx', () => {
    const content = readFile(
      'app/(manager)/dashboard/[client]/content/[id]/edit/page.tsx'
    )

    // Client component
    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Tiptap editor
    it('should import useEditor from @tiptap/react', () => {
      expect(content).toContain('useEditor')
      expect(content).toContain('@tiptap/react')
    })

    it('should import EditorContent from @tiptap/react', () => {
      expect(content).toContain('EditorContent')
    })

    it('should import StarterKit from @tiptap/starter-kit', () => {
      expect(content).toContain('StarterKit')
      expect(content).toContain('@tiptap/starter-kit')
    })

    it('should import Link extension from @tiptap/extension-link', () => {
      expect(content).toContain('@tiptap/extension-link')
    })

    it('should import Placeholder extension from @tiptap/extension-placeholder', () => {
      expect(content).toContain('@tiptap/extension-placeholder')
    })

    // Three-panel layout
    it('should have left brief panel', () => {
      expect(content).toMatch(/brief/i)
    })

    it('should have SEO score panel', () => {
      expect(content).toMatch(/seo/i)
    })

    // Data fetching
    it('should fetch content from API', () => {
      expect(content).toContain('/api/content/')
    })

    it('should use useState for content state', () => {
      expect(content).toContain('useState')
    })

    it('should use useEffect for data fetching', () => {
      expect(content).toContain('useEffect')
    })

    // Auto-save
    it('should implement auto-save with debounce', () => {
      expect(content).toMatch(/auto.?save|debounce|setTimeout/i)
    })

    it('should PUT to content API for saving', () => {
      expect(content).toContain('PUT')
    })

    // Content brief panel
    it('should display target keyword', () => {
      expect(content).toContain('target_keyword')
    })

    it('should display related keywords', () => {
      expect(content).toContain('related_keywords')
    })

    it('should display compliance status', () => {
      expect(content).toContain('compliance_status')
    })

    // SEO score panel
    it('should display seo_score', () => {
      expect(content).toContain('seo_score')
    })

    it('should show word count', () => {
      expect(content).toContain('word_count')
    })

    // Meta fields
    it('should have meta title input', () => {
      expect(content).toContain('meta_title')
    })

    it('should have meta description input', () => {
      expect(content).toContain('meta_description')
    })

    it('should show SERP preview', () => {
      expect(content).toMatch(/serp|SERP|preview/i)
    })

    // Toolbar
    it('should have bold toggle', () => {
      expect(content).toMatch(/bold|Bold/)
    })

    it('should have italic toggle', () => {
      expect(content).toMatch(/italic|Italic/)
    })

    it('should have heading toggle', () => {
      expect(content).toMatch(/heading|Heading/)
    })

    // Action buttons
    it('should have save draft button', () => {
      expect(content).toMatch(/save.*draft|Save.*Draft/i)
    })

    it('should have approve and publish button', () => {
      expect(content).toMatch(/approve.*publish|Approve.*Publish/i)
    })

    // Content piece interface
    it('should define ContentPiece interface or type', () => {
      expect(content).toContain('ContentPiece')
    })

    // Status display
    it('should display content status', () => {
      expect(content).toContain('status')
    })

    // Editor toolbar commands
    it('should use toggleBold command', () => {
      expect(content).toContain('toggleBold')
    })

    it('should use toggleItalic command', () => {
      expect(content).toContain('toggleItalic')
    })

    // Body html handling
    it('should load body_html into editor', () => {
      expect(content).toContain('body_html')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('tiptap packages installed', () => {
    const packageJson = readFile('package.json')

    it('should have @tiptap/react installed', () => {
      expect(packageJson).toContain('@tiptap/react')
    })

    it('should have @tiptap/starter-kit installed', () => {
      expect(packageJson).toContain('@tiptap/starter-kit')
    })

    it('should have @tiptap/extension-link installed', () => {
      expect(packageJson).toContain('@tiptap/extension-link')
    })

    it('should have @tiptap/extension-placeholder installed', () => {
      expect(packageJson).toContain('@tiptap/extension-placeholder')
    })
  })
})
