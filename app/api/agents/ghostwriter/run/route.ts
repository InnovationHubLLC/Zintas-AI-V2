import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'

const GhostwriterRunSchema = z.object({
  clientId: z.string().uuid(),
  contentType: z.enum(['blog', 'gbp_post', 'social']),
  topic: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = GhostwriterRunSchema.parse(await request.json())

    // TODO: Run Ghostwriter agent via LangGraph (TASK-22)
    return NextResponse.json({
      status: 'accepted',
      clientId: body.clientId,
      contentType: body.contentType,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ghostwriter agent failed' }, { status: 500 })
  }
}
