import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { findCompetitors } from '@packages/audit-engine/competitor-finder'
import { getClientById, updateClient } from '@packages/db/queries'

const SuggestSchema = z.object({
  action: z.literal('suggest'),
  clientId: z.string().min(1),
  location: z.string().min(1),
  vertical: z.string().min(1),
})

const FinalizeSchema = z.object({
  action: z.literal('finalize'),
  clientId: z.string().min(1),
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        domain: z.string().min(1),
      })
    )
    .min(1)
    .max(5),
})

const CompetitorRequestSchema = z.discriminatedUnion('action', [
  SuggestSchema,
  FinalizeSchema,
])

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = CompetitorRequestSchema.parse(await request.json())

    if (body.action === 'suggest') {
      const client = await getClientById(body.clientId)
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      const competitors = await findCompetitors(
        body.location,
        body.vertical,
        client.domain
      )

      return NextResponse.json({ competitors })
    }

    if (body.action === 'finalize') {
      const client = await getClientById(body.clientId)
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      await updateClient(body.clientId, {
        competitors: body.competitors,
        onboarding_step: 4,
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to process competitor request' },
      { status: 500 }
    )
  }
}
