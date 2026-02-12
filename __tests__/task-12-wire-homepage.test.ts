import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

describe('TASK-12: Wire Homepage', () => {
  const content = readFile('app/page.tsx')

  describe('ROI Calculator integration', () => {
    it('should import ROICalculator', () => {
      expect(content).toContain('ROICalculator')
    })

    it('should import from roi-calculator component', () => {
      expect(content).toContain('roi-calculator')
    })

    it('should render ROICalculator in JSX', () => {
      expect(content).toMatch(/<ROICalculator/)
    })
  })

  describe('CTA buttons link to correct routes', () => {
    it('should not link any CTA to /practice/dashboard', () => {
      expect(content).not.toContain('/practice/dashboard')
    })

    it('should link Get Started buttons to /sign-up', () => {
      expect(content).toContain('/sign-up')
    })

    it('should link audit button to /audit', () => {
      expect(content).toContain('/audit')
    })
  })

  describe('FAQ section', () => {
    it('should import Accordion components', () => {
      expect(content).toContain('Accordion')
      expect(content).toContain('AccordionItem')
      expect(content).toContain('AccordionTrigger')
      expect(content).toContain('AccordionContent')
    })

    it('should have FAQ question: How does AI replace a marketing agency?', () => {
      expect(content).toContain('How does AI replace a marketing agency?')
    })

    it('should have FAQ question: Will the content sound like my practice?', () => {
      expect(content).toContain('Will the content sound like my practice?')
    })

    it('should have FAQ question: How long until I see results?', () => {
      expect(content).toContain('How long until I see results?')
    })

    it('should have FAQ question: Do I need any technical knowledge?', () => {
      expect(content).toContain('Do I need any technical knowledge?')
    })

    it('should have FAQ question: Can I cancel anytime?', () => {
      expect(content).toContain('Can I cancel anytime?')
    })

    it('should have FAQ question: Is my data safe?', () => {
      expect(content).toContain('Is my data safe?')
    })

    it('should have answers for each FAQ question', () => {
      // Check that substantial answers exist (not just questions)
      expect(content).toContain('marketing agency')
      expect(content).toContain('onboarding')
      expect(content).toContain('60-90 days')
    })
  })

  describe('social proof', () => {
    it('should display 500+ dental practices trust Zintas', () => {
      expect(content).toMatch(/500\+.*dental practices.*trust.*Zintas/i)
    })
  })

  describe('testimonials', () => {
    it('should have testimonial data-testid attribute', () => {
      expect(content).toContain('data-testid="testimonial"')
    })

    it('should have 3 testimonials in TESTIMONIALS array', () => {
      // Verify the TESTIMONIALS array has exactly 3 entries by counting name fields
      const nameMatches = content.match(/name: 'Dr\./g)
      expect(nameMatches).not.toBeNull()
      expect(nameMatches!.length).toBe(3)
    })

    it('should have testimonial from Dr. Sarah Mitchell', () => {
      expect(content).toContain('Dr. Sarah Mitchell')
    })

    it('should have testimonial from Dr. James Park', () => {
      expect(content).toContain('Dr. James Park')
    })

    it('should have testimonial from Dr. Maria Santos', () => {
      expect(content).toContain('Dr. Maria Santos')
    })

    it('should include practice names and locations', () => {
      expect(content).toContain('Austin')
      expect(content).toContain('Denver')
      expect(content).toContain('Miami')
    })
  })

  describe('page structure', () => {
    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should have Frequently Asked Questions heading', () => {
      expect(content).toContain('Frequently Asked Questions')
    })

    it('should have Calculate Your ROI heading', () => {
      expect(content).toContain('Calculate Your ROI')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
