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

describe('TASK-40: Error Handling + Loading States', () => {
  // ── File Existence ────────────────────────────────────────
  describe('file existence', () => {
    it('loading-skeleton component should exist', () => {
      expect(fileExists('app/components/loading-skeleton.tsx')).toBe(true)
    })

    it('error-boundary component should exist', () => {
      expect(fileExists('app/components/error-boundary.tsx')).toBe(true)
    })

    it('api-error component should exist', () => {
      expect(fileExists('app/components/api-error.tsx')).toBe(true)
    })

    it('toast component should exist', () => {
      expect(fileExists('app/components/toast.tsx')).toBe(true)
    })
  })

  // ── Loading Skeleton ──────────────────────────────────────
  describe('loading-skeleton: app/components/loading-skeleton.tsx', () => {
    const content = readFile('app/components/loading-skeleton.tsx')

    it('should export DashboardSkeleton', () => {
      expect(content).toContain('DashboardSkeleton')
    })

    it('should export TableSkeleton', () => {
      expect(content).toContain('TableSkeleton')
    })

    it('should export EditorSkeleton', () => {
      expect(content).toContain('EditorSkeleton')
    })

    it('should use animate-pulse for skeleton effect', () => {
      expect(content).toContain('animate-pulse')
    })

    it('should include KPI card skeletons in dashboard', () => {
      expect(content).toMatch(/KPI|kpi|card/i)
    })

    it('should include table row skeletons', () => {
      expect(content).toMatch(/row|Row|table/i)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Error Boundary ────────────────────────────────────────
  describe('error-boundary: app/components/error-boundary.tsx', () => {
    const content = readFile('app/components/error-boundary.tsx')

    it('should be a class component (React error boundaries require it)', () => {
      expect(content).toMatch(/class.*extends.*Component|ErrorBoundary/)
    })

    it('should implement componentDidCatch or getDerivedStateFromError', () => {
      expect(content).toMatch(/componentDidCatch|getDerivedStateFromError/)
    })

    it('should have error state', () => {
      expect(content).toMatch(/hasError|error/)
    })

    it('should show Try Again button', () => {
      expect(content).toMatch(/Try Again|try again|reset|Reset/)
    })

    it('should log errors', () => {
      expect(content).toMatch(/console\.error|Sentry|logError/)
    })

    it('should render children when no error', () => {
      expect(content).toContain('children')
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── API Error ─────────────────────────────────────────────
  describe('api-error: app/components/api-error.tsx', () => {
    const content = readFile('app/components/api-error.tsx')

    it('should handle 401 unauthorized', () => {
      expect(content).toContain('401')
    })

    it('should show sign-in message for 401', () => {
      expect(content).toMatch(/sign.*in|Sign.*In|not.*signed/i)
    })

    it('should handle 403 forbidden', () => {
      expect(content).toContain('403')
    })

    it('should show access denied for 403', () => {
      expect(content).toMatch(/access|permission|forbidden/i)
    })

    it('should handle 404 not found', () => {
      expect(content).toContain('404')
    })

    it('should handle 429 rate limit', () => {
      expect(content).toContain('429')
    })

    it('should show rate limit message', () => {
      expect(content).toMatch(/too many|rate|wait/i)
    })

    it('should handle 500 server error', () => {
      expect(content).toContain('500')
    })

    it('should handle network error', () => {
      expect(content).toMatch(/network|internet|connect/i)
    })

    it('should have retry functionality', () => {
      expect(content).toMatch(/retry|Retry|try again|Try Again/i)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Toast Component ───────────────────────────────────────
  describe('toast: app/components/toast.tsx', () => {
    const content = readFile('app/components/toast.tsx')

    it('should support success type', () => {
      expect(content).toContain('success')
    })

    it('should support error type', () => {
      expect(content).toContain('error')
    })

    it('should support info type', () => {
      expect(content).toContain('info')
    })

    it('should export Toaster component', () => {
      expect(content).toContain('Toaster')
    })

    it('should export toast function or useToast hook', () => {
      expect(content).toMatch(/export.*toast|useToast/)
    })

    it('should auto-dismiss', () => {
      expect(content).toMatch(/setTimeout|duration|auto/)
    })

    it('should not use any type', () => {
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })

  // ── Layout integration ────────────────────────────────────
  describe('layout integration', () => {
    it('practice layout should include Toaster', () => {
      const layout = readFile('app/(practice)/layout.tsx')
      expect(layout).toContain('Toaster')
    })

    it('manager layout should include Toaster', () => {
      const layout = readFile('app/(manager)/layout.tsx')
      expect(layout).toContain('Toaster')
    })

    it('practice layout should include ErrorBoundary', () => {
      const layout = readFile('app/(practice)/layout.tsx')
      expect(layout).toContain('ErrorBoundary')
      expect(layout).toContain("import { ErrorBoundary } from '@/app/components/error-boundary'")
    })

    it('manager layout should include ErrorBoundary', () => {
      const layout = readFile('app/(manager)/layout.tsx')
      expect(layout).toContain('ErrorBoundary')
      expect(layout).toContain("import { ErrorBoundary } from '@/app/components/error-boundary'")
    })

    it('ErrorBoundary should wrap children in practice layout', () => {
      const layout = readFile('app/(practice)/layout.tsx')
      expect(layout).toMatch(/<ErrorBoundary>[\s\S]*?\{children\}[\s\S]*?<\/ErrorBoundary>/)
    })

    it('ErrorBoundary should wrap children in manager layout', () => {
      const layout = readFile('app/(manager)/layout.tsx')
      expect(layout).toMatch(/<ErrorBoundary>[\s\S]*?\{children\}[\s\S]*?<\/ErrorBoundary>/)
    })
  })

  // ── Page error handling ───────────────────────────────────
  describe('page error handling patterns', () => {
    it('practice dashboard should use ApiError component', () => {
      const content = readFile('app/(practice)/practice/dashboard/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain("import { ApiError } from '@/app/components/api-error'")
    })

    it('practice dashboard should use typed error state', () => {
      const content = readFile('app/(practice)/practice/dashboard/page.tsx')
      expect(content).toMatch(/useState<number \| 'network' \| null>/)
    })

    it('practice content should use ApiError component', () => {
      const content = readFile('app/(practice)/practice/content/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain("import { ApiError } from '@/app/components/api-error'")
    })

    it('practice content should set error on non-ok response', () => {
      const content = readFile('app/(practice)/practice/content/page.tsx')
      expect(content).toContain('setError(response.status)')
      expect(content).toContain("setError('network')")
    })

    it('practice reports should use ApiError component', () => {
      const content = readFile('app/(practice)/practice/reports/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain("import { ApiError } from '@/app/components/api-error'")
    })

    it('practice settings should use ApiError for fetch errors', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain('fetchError')
    })

    it('manager portfolio should use ApiError component', () => {
      const content = readFile('app/(manager)/dashboard/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain("import { ApiError } from '@/app/components/api-error'")
    })

    it('manager leads should use ApiError component', () => {
      const content = readFile('app/(manager)/dashboard/leads/page.tsx')
      expect(content).toContain('ApiError')
    })

    it('client detail should use ApiError component', () => {
      const content = readFile('app/(manager)/dashboard/[client]/page.tsx')
      expect(content).toContain('ApiError')
      expect(content).toContain("import { ApiError } from '@/app/components/api-error'")
    })

    it('client detail should use useToast for action feedback', () => {
      const content = readFile('app/(manager)/dashboard/[client]/page.tsx')
      expect(content).toContain('useToast')
      expect(content).toContain("toast('success'")
      expect(content).toContain("toast('error'")
    })
  })

  // ── TASK-38 Fixes ─────────────────────────────────────────
  describe('TASK-38 fixes: email route security', () => {
    it('email route should have escapeHtml function', () => {
      const content = readFile('app/api/leads/[id]/email/route.ts')
      expect(content).toContain('function escapeHtml')
      expect(content).toContain('&amp;')
      expect(content).toContain('&lt;')
      expect(content).toContain('&gt;')
    })

    it('email route should validate UUID format', () => {
      const content = readFile('app/api/leads/[id]/email/route.ts')
      expect(content).toContain('z.string().uuid()')
    })

    it('email route should have per-user rate limiting', () => {
      const content = readFile('app/api/leads/[id]/email/route.ts')
      expect(content).toContain('emailRateLimiter')
      expect(content).toContain('checkRateLimit')
    })

    it('email route should have per-lead dedup rate limiting', () => {
      const content = readFile('app/api/leads/[id]/email/route.ts')
      expect(content).toContain('emailPerLeadLimiter')
    })

    it('email route should use escaped domain in HTML', () => {
      const content = readFile('app/api/leads/[id]/email/route.ts')
      expect(content).toContain('safeDomain')
      expect(content).toContain('escapeHtml(lead.domain)')
    })

    it('rate-limit file should export emailRateLimiter', () => {
      const content = readFile('packages/db/rate-limit.ts')
      expect(content).toContain('export const emailRateLimiter')
      expect(content).toContain('@zintas/ratelimit/email')
    })

    it('rate-limit file should export emailPerLeadLimiter', () => {
      const content = readFile('packages/db/rate-limit.ts')
      expect(content).toContain('export const emailPerLeadLimiter')
      expect(content).toContain('@zintas/ratelimit/email-lead')
    })

    it('leads page should filter null scores from avg calculation', () => {
      const content = readFile('app/(manager)/dashboard/leads/page.tsx')
      expect(content).toMatch(/filter.*audit_score !== null/)
    })

    it('leads page EmailDialog should use useToast', () => {
      const content = readFile('app/(manager)/dashboard/leads/page.tsx')
      expect(content).toContain('useToast')
    })
  })

  // ── TASK-39 Fixes ─────────────────────────────────────────
  describe('TASK-39 fixes: practice settings', () => {
    it('settings should have custom service input', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('customServiceInput')
      expect(content).toContain('addCustomService')
    })

    it('settings should render custom service chips with remove button', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('removeCustomService')
    })

    it('settings should use useToast instead of local Toast', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('useToast')
      expect(content).toContain("toast('success'")
      expect(content).toContain("toast('error'")
      // Should NOT have local Toast component
      expect(content).not.toMatch(/function Toast\(/)
    })

    it('settings Google Reconnect should redirect to onboarding', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('/onboarding/start?step=3')
    })

    it('settings CMS Reconnect should show coming soon toast', () => {
      const content = readFile('app/(practice)/practice/settings/page.tsx')
      expect(content).toContain('CMS reconnection coming soon')
    })

    it('profile API GET should not expose raw practice_profile', () => {
      const content = readFile('app/api/practice/profile/route.ts')
      // Should not have practice_profile in the response interface
      expect(content).not.toMatch(/practice_profile:\s*Record/)
    })

    it('profile API PUT should not accept domain in schema', () => {
      const content = readFile('app/api/practice/profile/route.ts')
      // UpdateProfileSchema should not include domain
      const schemaSection = content.split('UpdateProfileSchema')[1]?.split('})')?.[0] ?? ''
      expect(schemaSection).not.toContain('domain')
    })
  })
})
