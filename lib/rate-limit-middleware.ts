import { NextRequest, NextResponse } from 'next/server'
import type { RateLimiter } from '@packages/db/rate-limit'

type IdentifierFn = (request: NextRequest) => string

type RouteHandler = (request: NextRequest) => Promise<NextResponse>

export function withRateLimit(
  limiter: RateLimiter,
  identifierFn: IdentifierFn
): (handler: RouteHandler) => RouteHandler {
  return (handler: RouteHandler): RouteHandler => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const identifier = identifierFn(request)
      const result = await limiter.limit(identifier)

      const rateLimitHeaders: Record<string, string> = {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      }

      if (!result.success) {
        const retryAfterSeconds = Math.ceil(
          Math.max(0, result.reset - Date.now()) / 1000
        )

        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          {
            status: 429,
            headers: {
              ...rateLimitHeaders,
              'Retry-After': retryAfterSeconds.toString(),
            },
          }
        )
      }

      const response = await handler(request)

      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })

      newResponse.headers.set('X-RateLimit-Remaining', rateLimitHeaders['X-RateLimit-Remaining'])
      newResponse.headers.set('X-RateLimit-Reset', rateLimitHeaders['X-RateLimit-Reset'])

      return newResponse
    }
  }
}
