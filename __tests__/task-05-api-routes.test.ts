import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')
const API_DIR = path.resolve(PROJECT_ROOT, 'app/api')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(PROJECT_ROOT, relativePath), 'utf-8')
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.resolve(PROJECT_ROOT, relativePath))
}

describe('TASK-05: API Route Scaffolding', () => {
  describe('Auth helpers', () => {
    it('should exist at lib/auth-helpers.ts', () => {
      expect(fileExists('lib/auth-helpers.ts')).toBe(true)
    })

    it('should export requireAuth', () => {
      const content = readFile('lib/auth-helpers.ts')
      expect(content).toMatch(/export async function requireAuth/)
    })

    it('should export requireRole', () => {
      const content = readFile('lib/auth-helpers.ts')
      expect(content).toMatch(/export async function requireRole/)
    })

    it('should export requireAgentKey', () => {
      const content = readFile('lib/auth-helpers.ts')
      expect(content).toMatch(/export function requireAgentKey/)
    })
  })

  describe('PUBLIC routes', () => {
    const routes = [
      { path: 'app/api/audit/free/route.ts', methods: ['POST'], hasZod: true },
      { path: 'app/api/audit/free/[id]/route.ts', methods: ['GET'], hasZod: false },
    ]

    routes.forEach(({ path: routePath, methods, hasZod }) => {
      describe(routePath, () => {
        it('should exist', () => {
          expect(fileExists(routePath)).toBe(true)
        })

        methods.forEach((method) => {
          it(`should export ${method}`, () => {
            const content = readFile(routePath)
            expect(content).toMatch(new RegExp(`export async function ${method}`))
          })
        })

        it('should NOT require auth (public route)', () => {
          const content = readFile(routePath)
          expect(content).not.toContain('requireRole')
        })

        if (hasZod) {
          it('should have Zod validation', () => {
            const content = readFile(routePath)
            expect(content).toContain('z.')
          })
        }
      })
    })
  })

  describe('ONBOARDING routes', () => {
    const routes = [
      { path: 'app/api/onboarding/create-org/route.ts', methods: ['POST'], hasZod: true },
      { path: 'app/api/onboarding/google-oauth/route.ts', methods: ['POST'], hasZod: false },
      { path: 'app/api/onboarding/google-oauth/callback/route.ts', methods: ['GET'], hasZod: false },
      { path: 'app/api/onboarding/detect-cms/route.ts', methods: ['POST'], hasZod: true },
      { path: 'app/api/onboarding/competitors/route.ts', methods: ['POST'], hasZod: true },
      { path: 'app/api/onboarding/complete/route.ts', methods: ['POST'], hasZod: false },
    ]

    routes.forEach(({ path: routePath, methods, hasZod }) => {
      describe(routePath, () => {
        it('should exist', () => {
          expect(fileExists(routePath)).toBe(true)
        })

        methods.forEach((method) => {
          it(`should export ${method}`, () => {
            const content = readFile(routePath)
            expect(content).toMatch(new RegExp(`export async function ${method}`))
          })
        })

        it('should require auth', () => {
          const content = readFile(routePath)
          expect(content).toContain('requireAuth')
        })

        if (hasZod) {
          it('should have Zod validation', () => {
            const content = readFile(routePath)
            expect(content).toContain('z.')
          })
        }
      })
    })
  })

  describe('PRACTICE routes', () => {
    const routes = [
      { path: 'app/api/practice/dashboard/route.ts', methods: ['GET'] },
      { path: 'app/api/practice/content/route.ts', methods: ['GET'] },
      { path: 'app/api/practice/content/[id]/route.ts', methods: ['GET'] },
      { path: 'app/api/practice/reports/route.ts', methods: ['GET'] },
      { path: 'app/api/practice/profile/route.ts', methods: ['GET', 'PUT'] },
    ]

    routes.forEach(({ path: routePath, methods }) => {
      describe(routePath, () => {
        it('should exist', () => {
          expect(fileExists(routePath)).toBe(true)
        })

        methods.forEach((method) => {
          it(`should export ${method}`, () => {
            const content = readFile(routePath)
            expect(content).toMatch(new RegExp(`export async function ${method}`))
          })
        })

        it('should require practice_owner role', () => {
          const content = readFile(routePath)
          expect(content).toContain("org:practice_owner")
        })
      })
    })
  })

  describe('MANAGER routes', () => {
    const routes = [
      { path: 'app/api/clients/route.ts', methods: ['GET', 'POST'] },
      { path: 'app/api/clients/[id]/route.ts', methods: ['GET', 'PUT'] },
      { path: 'app/api/queue/route.ts', methods: ['GET'] },
      { path: 'app/api/queue/[id]/approve/route.ts', methods: ['POST'] },
      { path: 'app/api/queue/[id]/reject/route.ts', methods: ['POST'] },
      { path: 'app/api/queue/bulk-approve/route.ts', methods: ['POST'] },
      { path: 'app/api/content/[id]/route.ts', methods: ['GET', 'PUT'] },
      { path: 'app/api/content/[id]/publish/route.ts', methods: ['POST'] },
      { path: 'app/api/keywords/[clientId]/route.ts', methods: ['GET'] },
      { path: 'app/api/agents/run/route.ts', methods: ['POST'] },
      { path: 'app/api/agents/runs/[clientId]/route.ts', methods: ['GET'] },
      { path: 'app/api/leads/route.ts', methods: ['GET'] },
      { path: 'app/api/gbp/[clientId]/posts/route.ts', methods: ['GET', 'POST'] },
    ]

    routes.forEach(({ path: routePath, methods }) => {
      describe(routePath, () => {
        it('should exist', () => {
          expect(fileExists(routePath)).toBe(true)
        })

        methods.forEach((method) => {
          it(`should export ${method}`, () => {
            const content = readFile(routePath)
            expect(content).toMatch(new RegExp(`export async function ${method}`))
          })
        })

        it('should require manager role', () => {
          const content = readFile(routePath)
          expect(content).toContain("org:manager")
        })
      })
    })
  })

  describe('AGENT INTERNAL routes', () => {
    const routes = [
      'app/api/agents/scholar/run/route.ts',
      'app/api/agents/ghostwriter/run/route.ts',
      'app/api/agents/conductor/run/route.ts',
      'app/api/agents/analyst/snapshot/route.ts',
      'app/api/compliance/check/route.ts',
    ]

    routes.forEach((routePath) => {
      describe(routePath, () => {
        it('should exist', () => {
          expect(fileExists(routePath)).toBe(true)
        })

        it('should export POST', () => {
          const content = readFile(routePath)
          expect(content).toMatch(/export async function POST/)
        })

        it('should use requireAgentKey', () => {
          const content = readFile(routePath)
          expect(content).toContain('requireAgentKey')
        })

        it('should have Zod validation', () => {
          const content = readFile(routePath)
          expect(content).toContain('z.')
        })
      })
    })
  })

  describe('No any types', () => {
    it('auth-helpers should not contain any type', () => {
      const content = readFile('lib/auth-helpers.ts')
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
