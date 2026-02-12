import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAgentKey } from '@/lib/auth-helpers'
import { runScholar } from '@packages/agents/scholar'
import { getClientById } from '@packages/db/queries/clients'

const ScholarRunSchema = z.object({
  clientId: z.string().uuid(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAgentKey(request)
  if (authError) return authError

  try {
    const body = ScholarRunSchema.parse(await request.json())

    const client = await getClientById(body.clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const result = await runScholar(body.clientId, client.org_id)

    return NextResponse.json({
      runId: result.runId,
      status: result.status,
      keywordsFound: result.keywordsFound,
      contentTopics: result.contentTopics,
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Scholar agent failed' }, { status: 500 })
  }
}
