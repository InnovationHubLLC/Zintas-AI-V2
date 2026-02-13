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

describe('TASK-39: Practice Settings / Profile Wiring', () => {
  describe('file existence', () => {
    it('practice profile API route should exist', () => {
      expect(fileExists('app/api/practice/profile/route.ts')).toBe(true)
    })

    it('practice settings page should exist', () => {
      expect(fileExists('app/(practice)/practice/settings/page.tsx')).toBe(true)
    })
  })

  // ── Profile API Route ─────────────────────────────────────
  describe('profile route: app/api/practice/profile/route.ts', () => {
    const content = readFile('app/api/practice/profile/route.ts')

    it('should export GET handler', () => {
      expect(content).toMatch(/export async function GET/)
    })

    it('should export PUT handler', () => {
      expect(content).toMatch(/export async function PUT/)
    })

    it('should require practice_owner role', () => {
      expect(content).toContain("'org:practice_owner'")
    })

    it('should use Zod validation', () => {
      expect(content).toContain('z.object')
    })

    it('should validate doctors array', () => {
      expect(content).toContain('doctors')
    })

    it('should validate locations array', () => {
      expect(content).toContain('locations')
    })

    it('should merge with existing practice_profile', () => {
      expect(content).toContain('practice_profile')
    })

    it('should return structured profile data in GET', () => {
      expect(content).toContain('connectedAccounts')
    })

    it('should return 404 for missing practice', () => {
      expect(content).toContain('404')
    })

    it('should return 400 for validation errors', () => {
      expect(content).toContain('400')
    })

    it('should return 500 on error', () => {
      expect(content).toContain('500')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Settings Page ─────────────────────────────────────────
  describe('settings page: app/(practice)/practice/settings/page.tsx', () => {
    const content = readFile('app/(practice)/practice/settings/page.tsx')

    it('should be a client component', () => {
      expect(content).toContain("'use client'")
    })

    // Data fetching
    it('should fetch from /api/practice/profile', () => {
      expect(content).toContain('/api/practice/profile')
    })

    it('should use PUT to save data', () => {
      expect(content).toContain('PUT')
    })

    // Tab 1: Practice Profile
    it('should have Practice Profile tab', () => {
      expect(content).toMatch(/Practice Profile|profile/i)
    })

    it('should have name field', () => {
      expect(content).toContain('name')
    })

    it('should have vertical dropdown', () => {
      expect(content).toContain('vertical')
    })

    it('should have description textarea', () => {
      expect(content).toContain('description')
    })

    // Tab 2: Doctors
    it('should have Doctors tab', () => {
      expect(content).toMatch(/Doctors|doctors/)
    })

    it('should have doctor name field', () => {
      expect(content).toContain('name')
    })

    it('should have doctor title field', () => {
      expect(content).toContain('title')
    })

    it('should have specialization field', () => {
      expect(content).toContain('specialization')
    })

    it('should have NPI field', () => {
      expect(content).toMatch(/npi|NPI/)
    })

    it('should support add doctor', () => {
      expect(content).toMatch(/add.*doctor|Add.*Doctor|addDoctor/i)
    })

    it('should support remove doctor', () => {
      expect(content).toMatch(/remove|Remove|delete|Delete/)
    })

    // Tab 3: Services
    it('should have Services tab', () => {
      expect(content).toMatch(/Services|services/)
    })

    it('should have service categories', () => {
      expect(content).toContain('General')
    })

    it('should have Cosmetic category', () => {
      expect(content).toContain('Cosmetic')
    })

    it('should have Orthodontics category', () => {
      expect(content).toContain('Orthodontics')
    })

    it('should use checkboxes for services', () => {
      expect(content).toContain('checkbox')
    })

    // Tab 4: Locations
    it('should have Locations tab', () => {
      expect(content).toMatch(/Locations|locations/)
    })

    it('should have address field for locations', () => {
      expect(content).toContain('address')
    })

    it('should have phone field for locations', () => {
      expect(content).toContain('phone')
    })

    it('should have hours grid', () => {
      expect(content).toMatch(/hours|Hours/)
    })

    it('should show days of the week', () => {
      expect(content).toContain('Mon')
    })

    it('should support primary location', () => {
      expect(content).toMatch(/primary|Primary/)
    })

    // Tab 5: Connected Accounts
    it('should have Connected Accounts tab', () => {
      expect(content).toMatch(/Connected|connected/)
    })

    it('should show Google status', () => {
      expect(content).toMatch(/Google|GSC|GBP/)
    })

    it('should show CMS status', () => {
      expect(content).toContain('CMS')
    })

    it('should show connection status indicator', () => {
      expect(content).toMatch(/Connected|Disconnected/)
    })

    it('should have Reconnect button', () => {
      expect(content).toMatch(/Reconnect|reconnect/)
    })

    // Form validation
    it('should use react-hook-form', () => {
      expect(content).toMatch(/useForm|react-hook-form/)
    })

    it('should use zod resolver', () => {
      expect(content).toMatch(/zodResolver|@hookform/)
    })

    // Save functionality
    it('should have save button', () => {
      expect(content).toMatch(/Save|save/)
    })

    it('should show success toast on save', () => {
      expect(content).toMatch(/toast|Toast|success|Saved/)
    })

    // Loading state
    it('should show loading state', () => {
      expect(content).toMatch(/loading|skeleton|animate-pulse/i)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Sidebar Navigation ────────────────────────────────────
  describe('practice sidebar navigation', () => {
    const layout = readFile('app/(practice)/layout.tsx')

    it('should have Settings link in navigation', () => {
      expect(layout).toContain('/practice/settings')
    })

    it('should have Settings label', () => {
      expect(layout).toContain('Settings')
    })
  })
})
