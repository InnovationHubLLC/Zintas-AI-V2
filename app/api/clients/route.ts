import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getAllClients, createClient } from '@packages/db/queries'

const CreateClientSchema = z.object({
  name: z.string().min(1),
  domain: z.string().url(),
})

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const clients = await getAllClients()
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const body = CreateClientSchema.parse(await request.json())

    // TODO: Create Clerk org for the client (TASK-19)
    const client = await createClient({
      org_id: authResult.orgId,
      name: body.name,
      domain: body.domain,
      management_mode: 'managed',
      vertical: 'dental',
      health_score: 0,
      practice_profile: {},
      google_tokens: {},
      cms_type: null,
      cms_credentials: {},
      account_health: 'active',
      competitors: [],
      onboarding_step: null,
      onboarding_completed_at: null,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
