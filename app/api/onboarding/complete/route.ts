import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-helpers'
import { clerkClient } from '@clerk/nextjs/server'
import { getClientById, updateClient } from '@packages/db/queries'
import { createRun } from '@packages/db/queries/agent-runs'

const CompleteOnboardingSchema = z.object({
  clientId: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    if (!authResult.orgId) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    const body = CompleteOnboardingSchema.parse(await request.json())

    const client = await getClientById(body.clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Validate minimum requirements
    const missing: string[] = []

    // Check practice_profile has address
    const profile = client.practice_profile as Record<string, unknown>
    if (!client.name || !profile.address) {
      missing.push('Practice name and address are required')
    }

    // Check at least 1 competitor
    if (!client.competitors || client.competitors.length < 1) {
      missing.push('At least one competitor must be configured')
    }

    // Check google_tokens set or skipped
    const tokens = client.google_tokens as Record<string, unknown>
    const googleReady = Boolean(tokens.encrypted) || Boolean(tokens.skipped)
    if (!googleReady) {
      missing.push('Google account must be connected or explicitly skipped')
    }

    if (missing.length > 0) {
      return NextResponse.json(
        { error: 'Onboarding requirements not met', details: missing },
        { status: 400 }
      )
    }

    // Mark onboarding complete
    await updateClient(client.id, {
      onboarding_step: null,
      onboarding_completed_at: new Date().toISOString(),
    })

    // Trigger initial agent run (fire-and-forget)
    try {
      await createRun({
        org_id: client.org_id,
        client_id: client.id,
        agent: 'conductor',
        graph_id: null,
        status: 'running',
        trigger: 'onboarding',
        config: {},
        result: {},
        error: null,
        completed_at: null,
        checkpoint_data: {},
      })
    } catch {
      // Agent run failure should not block onboarding completion
    }

    // Send welcome email (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const { WelcomeEmail } = await import(
          '@packages/audit-engine/emails/welcome'
        )
        const resend = new Resend(process.env.RESEND_API_KEY)

        const clerk = await clerkClient()
        const user = await clerk.users.getUser(authResult.userId)
        const email = user.emailAddresses[0]?.emailAddress

        if (email) {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://zintas.ai'}/practice/dashboard`
          await resend.emails.send({
            from: 'Zintas AI <hello@zintas.ai>',
            to: email,
            subject:
              'Welcome to Zintas AI! Your marketing team is getting to work.',
            react: WelcomeEmail({
              practiceName: client.name,
              dashboardUrl,
            }),
          })
        }
      } catch {
        // Email failure should not block the response
      }
    }

    return NextResponse.json({
      success: true,
      redirectTo: '/practice/dashboard',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}
