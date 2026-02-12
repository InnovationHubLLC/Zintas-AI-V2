import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, updateClient } from '@packages/db/queries'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional(),
  practice_profile: z.record(z.unknown()).optional(),
})

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const body = UpdateProfileSchema.parse(await request.json())

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    const updated = await updateClient(client.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
