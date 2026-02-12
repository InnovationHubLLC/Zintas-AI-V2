import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { clerkClient } from '@clerk/nextjs/server'
import { createClient, getClientByDomain, updateClient } from '@packages/db/queries'
import { detectCMS } from '@packages/audit-engine/detect-cms'

const CreateOrgSchema = z.object({
  practiceName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
  address: z.string().min(1),
  managementMode: z.enum(['managed', 'self_service']).default('self_service'),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const body = CreateOrgSchema.parse(await request.json())

    // Check for duplicate domain before creating anything
    const existingClient = await getClientByDomain(body.domain)
    if (existingClient) {
      return NextResponse.json(
        { error: 'Practice already registered' },
        { status: 409 }
      )
    }

    // Create Clerk Organization
    const clerk = await clerkClient()
    const org = await clerk.organizations.createOrganization({
      name: body.practiceName,
      createdBy: authResult.userId,
    })

    // Add user as practice_owner member
    await clerk.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: authResult.userId,
      role: 'org:practice_owner',
    })

    // Create client record in Supabase
    const client = await createClient({
      org_id: org.id,
      name: body.practiceName,
      domain: body.domain,
      management_mode: body.managementMode,
      vertical: body.vertical,
      health_score: 0,
      practice_profile: { address: body.address, vertical: body.vertical },
      google_tokens: {},
      cms_type: null,
      cms_credentials: {},
      account_health: 'active',
      competitors: [],
      onboarding_step: 2,
      onboarding_completed_at: null,
    })

    // Auto-detect CMS (non-blocking — failure should not block org creation)
    let cmsResult
    try {
      cmsResult = await detectCMS(body.domain)
      await updateClient(client.id, { cms_type: cmsResult.cms })
    } catch {
      cmsResult = {
        cms: 'unknown',
        confidence: 'none',
        apiAvailable: false,
        setupInstructions: '',
      }
    }

    return NextResponse.json(
      { orgId: org.id, clientId: client.id, cmsResult },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
