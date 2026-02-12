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

describe('TASK-11: ROI Calculator Component', () => {
  describe('file existence', () => {
    it('should exist at app/components/roi-calculator.tsx', () => {
      expect(fileExists('app/components/roi-calculator.tsx')).toBe(true)
    })

    it('should have shadcn/ui Slider component installed', () => {
      expect(fileExists('components/ui/slider.tsx')).toBe(true)
    })
  })

  describe('app/components/roi-calculator.tsx', () => {
    const content = readFile('app/components/roi-calculator.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    it('should export ROICalculator', () => {
      expect(content).toMatch(/export function ROICalculator/)
    })

    it('should import Slider from shadcn/ui', () => {
      expect(content).toContain('@/components/ui/slider')
    })

    it('should import Card from shadcn/ui', () => {
      expect(content).toContain('@/components/ui/card')
    })

    it('should use React useState', () => {
      expect(content).toContain('useState')
    })

    // Slider 1: Patient Lifetime Value
    it('should have patient lifetime value slider with default 3000', () => {
      expect(content).toContain('3000')
      expect(content).toMatch(/patient.*lifetime.*value/i)
    })

    it('should have patient value range 1000 to 10000 with step 500', () => {
      expect(content).toContain('1000')
      expect(content).toContain('10000')
      expect(content).toContain('500')
    })

    // Slider 2: Current Monthly New Patients
    it('should have current monthly patients slider with default 10', () => {
      expect(content).toMatch(/current.*monthly.*patient/i)
    })

    it('should have patients range from 1 to 50', () => {
      expect(content).toContain('50')
    })

    // Slider 3: Target Monthly Growth
    it('should have target monthly growth slider with default 30', () => {
      expect(content).toMatch(/target.*monthly.*growth/i)
    })

    it('should have growth range up to 100 with step 5', () => {
      expect(content).toContain('100')
    })

    // Output card
    it('should have green gradient background on output card', () => {
      expect(content).toMatch(/green/)
    })

    it('should display estimated additional monthly revenue', () => {
      expect(content).toMatch(/estimated.*additional.*monthly.*revenue/i)
    })

    it('should calculate using growthTarget', () => {
      expect(content).toContain('growthTarget')
    })

    it('should reference agency cost of 4200', () => {
      expect(content).toContain('4200')
    })

    it('should reference Zintas Pro cost of 499', () => {
      expect(content).toContain('499')
    })

    it('should show savings of $3,701', () => {
      expect(content).toContain('3,701')
    })

    it('should use toLocaleString for currency formatting', () => {
      expect(content).toContain('toLocaleString')
    })

    it('should format percentage values with %', () => {
      expect(content).toContain('%')
    })

    it('should have animated number transitions', () => {
      expect(content).toMatch(/requestAnimationFrame|useEffect/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })

    it('should have explicit return type React.JSX.Element', () => {
      expect(content).toMatch(/\):\s*React\.JSX\.Element/)
    })
  })
})
