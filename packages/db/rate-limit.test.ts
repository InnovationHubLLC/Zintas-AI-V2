import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}))

vi.mock('@upstash/ratelimit', () => {
  const mockSlidingWindow = vi.fn(() => 'sliding-window-algorithm')
  return {
    Ratelimit: Object.assign(
      vi.fn(() => ({
        limit: mockLimit,
      })),
      { slidingWindow: mockSlidingWindow }
    ),
  }
})

describe('TASK-07: Rate Limit Utilities', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  describe('rate limiter exports', () => {
    it('should export auditRateLimiter', async () => {
      const { auditRateLimiter } = await import('./rate-limit')
      expect(auditRateLimiter).toBeDefined()
      expect(auditRateLimiter.limit).toBeDefined()
    })

    it('should export apiRateLimiter', async () => {
      const { apiRateLimiter } = await import('./rate-limit')
      expect(apiRateLimiter).toBeDefined()
      expect(apiRateLimiter.limit).toBeDefined()
    })

    it('should export agentRateLimiter', async () => {
      const { agentRateLimiter } = await import('./rate-limit')
      expect(agentRateLimiter).toBeDefined()
      expect(agentRateLimiter.limit).toBeDefined()
    })

    it('should create three Ratelimit instances with correct sliding window configs', async () => {
      const { Ratelimit } = await import('@upstash/ratelimit')
      await import('./rate-limit')

      expect(Ratelimit).toHaveBeenCalledTimes(3)

      const slidingWindowCalls = vi.mocked(Ratelimit.slidingWindow).mock.calls
      expect(slidingWindowCalls).toEqual([
        [3, '1 h'],
        [100, '1 m'],
        [10, '1 m'],
      ])
    })
  })

  describe('checkRateLimit', () => {
    it('should return success with remaining and reset when under limit', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 5,
        reset: 1700000000000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { checkRateLimit, apiRateLimiter } = await import('./rate-limit')
      const result = await checkRateLimit(apiRateLimiter, 'user-123')

      expect(result).toEqual({
        success: true,
        remaining: 5,
        reset: 1700000000000,
      })
    })

    it('should return failure when rate limit exceeded', async () => {
      mockLimit.mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: 1700000060000,
        limit: 10,
        pending: Promise.resolve(),
      })

      const { checkRateLimit, apiRateLimiter } = await import('./rate-limit')
      const result = await checkRateLimit(apiRateLimiter, 'user-123')

      expect(result).toEqual({
        success: false,
        remaining: 0,
        reset: 1700000060000,
      })
    })

    it('should call limiter.limit with the provided identifier', async () => {
      mockLimit.mockResolvedValueOnce({
        success: true,
        remaining: 2,
        reset: 1700000000000,
        limit: 3,
        pending: Promise.resolve(),
      })

      const { checkRateLimit, auditRateLimiter } = await import('./rate-limit')
      await checkRateLimit(auditRateLimiter, '192.168.1.1')

      expect(mockLimit).toHaveBeenCalledWith('192.168.1.1')
    })
  })

  describe('no any types', () => {
    it('should not contain any type annotation', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const content = fs.readFileSync(
        path.resolve(__dirname, 'rate-limit.ts'),
        'utf-8'
      )
      expect(content.match(/:\s*any\b/g)).toBeNull()
    })
  })
})
