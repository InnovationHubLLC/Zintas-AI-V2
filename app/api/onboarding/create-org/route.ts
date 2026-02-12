import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { createClient } from '@packages/db/queries'

const CreateOrgSchema = z.object({
  name: z.string().min(1),
  domain: z.string().url(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = CreateOrgSchema.parse(await request.json())

    // TODO: Create Clerk organization first (TASK-19)
    // TODO: Set org role, assign user to org

    const client = await createClient({
      org_id: authResult.orgId || 'pending',
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
      onboarding_step: 1,
      onboarding_completed_at: null,
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
