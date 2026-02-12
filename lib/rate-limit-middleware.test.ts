import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockLimit = vi.fn()
const mockLimiter = { limit: mockLimit }

describe('TASK-07: Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  describe('withRateLimit', () => {
    it('should pass through to handler when under limit', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 9,
        reset: 1700000060000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' })
      )

      const identifierFn = vi.fn().mockReturnValue('user-123')
      const wrapped = withRateLimit(mockLimiter, identifierFn)(innerHandler)

      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      expect(identifierFn).toHaveBeenCalledWith(request)
      expect(mockLimit).toHaveBeenCalledWith('user-123')
      expect(innerHandler).toHaveBeenCalledWith(request)
      expect(response.status).toBe(200)
    })

    it('should include X-RateLimit-Remaining header when under limit', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 7,
        reset: 1700000060000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' })
      )

      const wrapped = withRateLimit(mockLimiter, () => 'user-456')(innerHandler)
      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('7')
    })

    it('should include X-RateLimit-Reset header when under limit', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 7,
        reset: 1700000060000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' })
      )

      const wrapped = withRateLimit(mockLimiter, () => 'user-789')(innerHandler)
      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000060000')
    })

    it('should return 429 when rate limit exceeded', async () => {
      mockLimit.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn()

      const wrapped = withRateLimit(mockLimiter, () => 'user-blocked')(innerHandler)
      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      expect(response.status).toBe(429)
      expect(innerHandler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.error).toBe('Rate limit exceeded')
    })

    it('should include Retry-After header in seconds when rate limited', async () => {
      const resetTime = Date.now() + 30000
      mockLimit.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: resetTime,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn()

      const wrapped = withRateLimit(mockLimiter, () => 'user-blocked')(innerHandler)
      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      const retryAfter = Number(response.headers.get('Retry-After'))
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(31)
    })

    it('should include rate limit headers in 429 response', async () => {
      mockLimit.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: 1700000060000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { withRateLimit } = await import('./rate-limit-middleware')
      const innerHandler = vi.fn()

      const wrapped = withRateLimit(mockLimiter, () => 'user-blocked')(innerHandler)
      const request = new NextRequest('http://localhost/api/test')
      const response = await wrapped(request)

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBe('1700000060000')
    })
  })

  describe('no any types', () => {
    it('should not contain any type annotation', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const content = fs.readFileSync(
        path.resolve(__dirname, 'rate-limit-middleware.ts'),
        'utf-8'
      )
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
