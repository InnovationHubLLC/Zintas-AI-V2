import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'

const AnalystSnapshotSchema = z.object({
  clientId: z.string().uuid(),
  metrics: z.array(z.enum(['seo', 'content', 'competitors', 'gbp'])).min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = AnalystSnapshotSchema.parse(await request.json())

    // TODO: Run Analyst snapshot via LangGraph (TASK-23)
    return NextResponse.json({
      status: 'accepted',
      clientId: body.clientId,
      metricsRequested: body.metrics,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Analyst snapshot failed' }, { status: 500 })
  }
}
