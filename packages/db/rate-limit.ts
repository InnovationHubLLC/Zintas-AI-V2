import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

interface RateLimiter {
  limit: (identifier: string) => Promise<{
    success: boolean
    remaining: number
    reset: number
    limit: number
    pending: Promise<unknown>
  }>
}

const redis = Redis.fromEnv()

export const auditRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  prefix: '@zintas/ratelimit/audit',
})

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  prefix: '@zintas/ratelimit/api',
})

export const agentRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: '@zintas/ratelimit/agent',
})

export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}

export type { RateLimiter, RateLimitResult }
