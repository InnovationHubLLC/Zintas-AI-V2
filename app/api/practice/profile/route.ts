import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, updateClient } from '@packages/db/queries'
import type { Client } from '@packages/db/types'

const DoctorSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  specialization: z.array(z.string()).optional(),
  npi: z.string().optional(),
  bio: z.string().optional(),
})

const LocationSchema = z.object({
  address: z.string().min(1),
  phone: z.string().optional(),
  hours: z.record(z.string()).optional(),
  primary: z.boolean().optional(),
})

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().url().optional(),
  vertical: z.string().optional(),
  description: z.string().optional(),
  doctors: z.array(DoctorSchema).optional(),
  services: z.array(z.string()).optional(),
  locations: z.array(LocationSchema).optional(),
  practice_profile: z.record(z.unknown()).optional(),
})

interface ProfileResponse {
  id: string
  name: string
  domain: string
  vertical: string
  description: string
  doctors: z.infer<typeof DoctorSchema>[]
  services: string[]
  locations: z.infer<typeof LocationSchema>[]
  connectedAccounts: {
    google: { gsc: boolean; ga: boolean; gbp: boolean; lastSync: string | null }
    cms: { connected: boolean; type: string | null; lastSync: string | null }
  }
  practice_profile: Record<string, unknown>
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    const profile = (client.practice_profile ?? {}) as Record<string, unknown>
    const googleTokens = (client.google_tokens ?? {}) as Record<string, unknown>

    const response: ProfileResponse = {
      id: client.id,
      name: client.name,
      domain: client.domain,
      vertical: client.vertical ?? 'dental',
      description: (profile.description as string) ?? '',
      doctors: (profile.doctors as z.infer<typeof DoctorSchema>[]) ?? [],
      services: (profile.services as string[]) ?? [],
      locations: (profile.locations as z.infer<typeof LocationSchema>[]) ?? [],
      connectedAccounts: {
        google: {
          gsc: Boolean(googleTokens.gsc_token),
          ga: Boolean(googleTokens.ga_token),
          gbp: Boolean(googleTokens.gbp_token),
          lastSync: (googleTokens.last_sync as string) ?? null,
        },
        cms: {
          connected: client.cms_type !== null,
          type: client.cms_type,
          lastSync: (profile.cms_last_sync as string) ?? null,
        },
      },
      practice_profile: profile,
    }

    return NextResponse.json(response)
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

    // Merge with existing practice_profile (don't lose data for fields not submitted)
    const existingProfile = (client.practice_profile ?? {}) as Record<string, unknown>
    const mergedProfile: Record<string, unknown> = {
      ...existingProfile,
      ...(body.practice_profile ?? {}),
    }

    if (body.description !== undefined) mergedProfile.description = body.description
    if (body.doctors !== undefined) mergedProfile.doctors = body.doctors
    if (body.services !== undefined) mergedProfile.services = body.services
    if (body.locations !== undefined) mergedProfile.locations = body.locations

    const updateData: Partial<Pick<Client, 'name' | 'vertical' | 'practice_profile'>> = {
      practice_profile: mergedProfile,
    }
    if (body.name !== undefined) updateData.name = body.name
    if (body.vertical !== undefined) updateData.vertical = body.vertical

    const updated = await updateClient(client.id, updateData)
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
