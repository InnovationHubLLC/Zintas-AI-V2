import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

describe('TASK-13: Wire Audit Tool Page', () => {
  const content = readFile('app/audit/page.tsx')

  describe('mock data removal', () => {
    it('should not contain mockAuditResults', () => {
      expect(content).not.toContain('mockAuditResults')
    })

    it('should not contain practiceName state', () => {
      expect(content).not.toContain('setPracticeName')
    })

    it('should not contain keyword opportunities section', () => {
      expect(content).not.toContain('Keyword Opportunities')
    })

    it('should not contain competitor analysis section', () => {
      expect(content).not.toContain('Your Competitors')
    })
  })

  describe('API integration', () => {
    it('should fetch from /api/audit/free', () => {
      expect(content).toContain('/api/audit/free')
    })

    it('should use POST method', () => {
      expect(content).toContain("method: 'POST'")
    })

    it('should send Content-Type application/json header', () => {
      expect(content).toContain('application/json')
    })

    it('should send recaptchaToken in request body', () => {
      expect(content).toContain('recaptchaToken')
    })

    it('should have AuditApiResponse type', () => {
      expect(content).toContain('AuditApiResponse')
    })

    it('should store audit result in state', () => {
      expect(content).toContain('setAuditResult')
    })
  })

  describe('URL normalization', () => {
    it('should have normalizeUrl function', () => {
      expect(content).toContain('normalizeUrl')
    })

    it('should add https:// prefix', () => {
      expect(content).toContain('https://')
    })
  })

  describe('reCAPTCHA v3', () => {
    it('should reference NEXT_PUBLIC_RECAPTCHA_SITE_KEY', () => {
      expect(content).toContain('NEXT_PUBLIC_RECAPTCHA_SITE_KEY')
    })

    it('should have getRecaptchaToken function', () => {
      expect(content).toContain('getRecaptchaToken')
    })

    it('should call grecaptcha', () => {
      expect(content).toContain('grecaptcha')
    })

    it('should handle dev bypass with dummy token', () => {
      expect(content).toContain('dev-bypass-token')
    })
  })

  describe('icon mapping', () => {
    it('should import Smartphone from lucide-react', () => {
      expect(content).toContain('Smartphone')
    })

    it('should import MapPin from lucide-react', () => {
      expect(content).toContain('MapPin')
    })

    it('should import Heading from lucide-react', () => {
      expect(content).toContain('Heading')
    })

    it('should have ICON_MAP constant', () => {
      expect(content).toContain('ICON_MAP')
    })
  })

  describe('status badges', () => {
    it('should have STATUS_CONFIG constant', () => {
      expect(content).toContain('STATUS_CONFIG')
    })

    it('should handle pass status', () => {
      expect(content).toContain('pass')
    })

    it('should handle warning status', () => {
      expect(content).toContain('warning')
    })

    it('should handle fail status', () => {
      expect(content).toContain('fail')
    })
  })

  describe('results display', () => {
    it('should import HealthScoreGauge', () => {
      expect(content).toContain('HealthScoreGauge')
    })

    it('should render HealthScoreGauge component', () => {
      expect(content).toMatch(/<HealthScoreGauge/)
    })

    it('should display grade', () => {
      expect(content).toContain('grade')
    })

    it('should display finding score and maxScore', () => {
      expect(content).toContain('maxScore')
    })

    it('should conditionally show recommendation', () => {
      expect(content).toContain('recommendation')
    })
  })

  describe('email handling', () => {
    it('should show email help text', () => {
      expect(content).toContain('Enter email to see full results')
    })
  })

  describe('error handling', () => {
    it('should have error state', () => {
      expect(content).toContain('setError')
    })

    it('should handle 429 rate limiting', () => {
      expect(content).toContain('429')
    })

    it('should have isSubmitting state', () => {
      expect(content).toContain('isSubmitting')
    })
  })

  describe('CTA', () => {
    it('should link to /sign-up', () => {
      expect(content).toContain('/sign-up')
    })

    it('should NOT link to /practice/dashboard', () => {
      expect(content).not.toContain('/practice/dashboard')
    })
  })

  describe('code quality', () => {
    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
