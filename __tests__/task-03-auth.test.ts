import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const PROJECT_ROOT = path.resolve(__dirname, '..')

describe('TASK-03: Clerk Auth Integration', () => {
  describe('Root Layout', () => {
    const layoutPath = path.resolve(PROJECT_ROOT, 'app/layout.tsx')

    it('should exist', () => {
      expect(fs.existsSync(layoutPath)).toBe(true)
    })

    it('should import ClerkProvider', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('ClerkProvider')
    })

    it('should wrap children with ClerkProvider', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toMatch(/<ClerkProvider[\s\S]*>[\s\S]*{children}[\s\S]*<\/ClerkProvider>/)
    })

    it('should include metadata', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Zintas AI')
    })
  })

  describe('Middleware', () => {
    const middlewarePath = path.resolve(PROJECT_ROOT, 'middleware.ts')

    it('should exist at project root', () => {
      expect(fs.existsSync(middlewarePath)).toBe(true)
    })

    it('should import clerkMiddleware', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('clerkMiddleware')
    })

    it('should import createRouteMatcher', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('createRouteMatcher')
    })

    it('should define public routes', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('/audit')
      expect(content).toContain('/pricing')
    })

    it('should handle onboarding redirect for users without org', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('/onboarding/start')
    })

    it('should redirect managers away from practice routes', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('org:manager')
    })

    it('should redirect practice owners away from manager routes', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('org:practice_owner')
    })

    it('should export route matcher config', () => {
      const content = fs.readFileSync(middlewarePath, 'utf-8')
      expect(content).toContain('export const config')
      expect(content).toContain('matcher')
    })
  })

  describe('Sign-in Page', () => {
    const signInPath = path.resolve(PROJECT_ROOT, 'app/sign-in/[[...sign-in]]/page.tsx')

    it('should exist', () => {
      expect(fs.existsSync(signInPath)).toBe(true)
    })

    it('should use Clerk SignIn component', () => {
      const content = fs.readFileSync(signInPath, 'utf-8')
      expect(content).toContain('SignIn')
      expect(content).toContain('@clerk/nextjs')
    })
  })

  describe('Sign-up Page', () => {
    const signUpPath = path.resolve(PROJECT_ROOT, 'app/sign-up/[[...sign-up]]/page.tsx')

    it('should exist', () => {
      expect(fs.existsSync(signUpPath)).toBe(true)
    })

    it('should use Clerk SignUp component', () => {
      const content = fs.readFileSync(signUpPath, 'utf-8')
      expect(content).toContain('SignUp')
      expect(content).toContain('@clerk/nextjs')
    })
  })

  describe('Onboarding Layout', () => {
    const onboardingLayoutPath = path.resolve(PROJECT_ROOT, 'app/(onboarding)/layout.tsx')

    it('should exist', () => {
      expect(fs.existsSync(onboardingLayoutPath)).toBe(true)
    })

    it('should have a minimal layout with Zintas branding', () => {
      const content = fs.readFileSync(onboardingLayoutPath, 'utf-8')
      expect(content).toContain('Zintas')
    })
  })

  describe('Onboarding Start Page', () => {
    const onboardingStartPath = path.resolve(PROJECT_ROOT, 'app/(onboarding)/onboarding/start/page.tsx')

    it('should exist', () => {
      expect(fs.existsSync(onboardingStartPath)).toBe(true)
    })
  })

  describe('Manager Layout', () => {
    const layoutPath = path.resolve(PROJECT_ROOT, 'app/(manager)/layout.tsx')

    it('should exist', () => {
      expect(fs.existsSync(layoutPath)).toBe(true)
    })

    it('should have Portfolio navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Portfolio')
    })

    it('should have Queue navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Queue')
    })
  })

  describe('Practice Layout', () => {
    const layoutPath = path.resolve(PROJECT_ROOT, 'app/(practice)/layout.tsx')

    it('should exist', () => {
      expect(fs.existsSync(layoutPath)).toBe(true)
    })

    it('should have Dashboard navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Dashboard')
    })

    it('should have Content navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Content')
    })

    it('should have Reports navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Reports')
    })

    it('should have Settings navigation', () => {
      const content = fs.readFileSync(layoutPath, 'utf-8')
      expect(content).toContain('Settings')
    })
  })
})
