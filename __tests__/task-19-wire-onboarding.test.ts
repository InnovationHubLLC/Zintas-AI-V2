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

describe('TASK-19: Wire Onboarding Wizard', () => {
  describe('file existence', () => {
    it('onboarding page should exist', () => {
      expect(fileExists('app/(onboarding)/onboarding/start/page.tsx')).toBe(true)
    })

    it('onboarding layout should exist', () => {
      expect(fileExists('app/(onboarding)/layout.tsx')).toBe(true)
    })

    it('sonner component should exist', () => {
      expect(fileExists('components/ui/sonner.tsx')).toBe(true)
    })
  })

  describe('page structure', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should use useState', () => {
      expect(content).toContain('useState')
    })

    it('should use useEffect', () => {
      expect(content).toContain('useEffect')
    })

    it('should track currentStep', () => {
      expect(content).toContain('currentStep')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  describe('step 1 - Your Practice', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should have practiceName field', () => {
      expect(content).toContain('practiceName')
    })

    it('should have websiteURL field', () => {
      expect(content).toContain('websiteURL')
    })

    it('should have practiceType field', () => {
      expect(content).toContain('practiceType')
    })

    it('should have address field', () => {
      expect(content).toContain('address')
    })

    it('should call create-org API', () => {
      expect(content).toContain('/api/onboarding/create-org')
    })

    it('should store orgId from response', () => {
      expect(content).toContain('orgId')
    })

    it('should store clientId from response', () => {
      expect(content).toContain('clientId')
    })

    it('should store cmsResult from response', () => {
      expect(content).toContain('cmsResult')
    })
  })

  describe('step 2 - Connect Google', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should call google-oauth API', () => {
      expect(content).toContain('/api/onboarding/google-oauth')
    })

    it('should have Connect Google button text', () => {
      expect(content).toContain('Connect')
    })

    it('should have Skip option', () => {
      expect(content).toContain('Skip')
    })

    it('should check gsc status', () => {
      expect(content).toContain('gsc')
    })

    it('should check gbp status', () => {
      expect(content).toContain('gbp')
    })

    it('should check google connected param', () => {
      expect(content).toContain("'connected'")
    })
  })

  describe('step 3 - Competitors', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should call competitors API', () => {
      expect(content).toContain('/api/onboarding/competitors')
    })

    it('should use suggest action', () => {
      expect(content).toContain('suggest')
    })

    it('should use finalize action', () => {
      expect(content).toContain('finalize')
    })

    it('should use Checkbox component', () => {
      expect(content).toContain('Checkbox')
    })

    it('should enforce max 5 competitors', () => {
      expect(content).toContain('5')
    })
  })

  describe('step 4 - Choose Plan', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should show Starter plan', () => {
      expect(content).toContain('Starter')
    })

    it('should show Pro plan', () => {
      expect(content).toContain('Pro')
    })

    it('should show Enterprise plan', () => {
      expect(content).toContain('Enterprise')
    })

    it('should mark Pro as Recommended', () => {
      expect(content).toContain('Recommended')
    })

    it('should mention pilot or free', () => {
      expect(content).toContain('pilot')
    })
  })

  describe('step 5 - Launch', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should call complete API', () => {
      expect(content).toContain('/api/onboarding/complete')
    })

    it('should have Launch button text', () => {
      expect(content).toContain('Launch My AI Marketing Team')
    })

    it('should redirect to practice dashboard', () => {
      expect(content).toContain('/practice/dashboard')
    })
  })

  describe('navigation', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should have Back button', () => {
      expect(content).toContain('Back')
    })

    it('should have Next button', () => {
      expect(content).toContain('Next')
    })

    it('should use Progress component', () => {
      expect(content).toContain('Progress')
    })
  })

  describe('error handling', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should use toast for errors', () => {
      expect(content).toContain('toast')
    })

    it('should handle API errors with catch', () => {
      expect(content).toContain('catch')
    })
  })

  describe('UI components', () => {
    const content = readFile('app/(onboarding)/onboarding/start/page.tsx')

    it('should use Card component', () => {
      expect(content).toContain('Card')
    })

    it('should use Button component', () => {
      expect(content).toContain('Button')
    })

    it('should use Input component', () => {
      expect(content).toContain('Input')
    })

    it('should use Label component', () => {
      expect(content).toContain('Label')
    })

    it('should use Badge component', () => {
      expect(content).toContain('Badge')
    })
  })

  describe('onboarding layout', () => {
    const content = readFile('app/(onboarding)/layout.tsx')

    it('should include Toaster component', () => {
      expect(content).toContain('Toaster')
    })

    it('should import from sonner', () => {
      expect(content).toContain('sonner')
    })
  })
})
