import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'

const ComplianceCheckSchema = z.object({
  contentId: z.string().uuid(),
  content: z.string().min(1),
  contentType: z.enum(['blog', 'gbp_post', 'social', 'review_response']),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = ComplianceCheckSchema.parse(await request.json())

    // TODO: Run compliance check via Claude (TASK-24)
    return NextResponse.json({
      status: 'accepted',
      contentId: body.contentId,
      contentType: body.contentType,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Compliance check failed' }, { status: 500 })
  }
}
