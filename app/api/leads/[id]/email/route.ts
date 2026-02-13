import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth-helpers'
import { getLeadById } from '@packages/db/queries'
import { checkRateLimit, emailRateLimiter, emailPerLeadLimiter } from '@packages/db/rate-limit'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params

    // Validate UUID format
    const parseResult = z.string().uuid().safeParse(id)
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 })
    }

    // Rate limit: per-user (10 emails/hour)
    const userRateLimit = await checkRateLimit(emailRateLimiter, authResult.userId)
    if (!userRateLimit.success) {
      return NextResponse.json({ error: 'Email rate limit exceeded. Try again later.' }, { status: 429 })
    }

    // Rate limit: per-lead (1 email/24h to prevent duplicate sends)
    const leadRateLimit = await checkRateLimit(emailPerLeadLimiter, `lead:${id}`)
    if (!leadRateLimit.success) {
      return NextResponse.json({ error: 'This lead was already emailed recently.' }, { status: 429 })
    }

    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })
    }

    const score = lead.audit_score ?? 0
    const safeDomain = escapeHtml(lead.domain)

    await resend.emails.send({
      from: 'Zintas AI <hello@zintas.ai>',
      to: lead.email,
      subject: `Your SEO audit for ${safeDomain}: ${score}/100`,
      html: `
        <p>Hi,</p>
        <p>You recently audited <strong>${safeDomain}</strong> and scored <strong>${score}/100</strong>.</p>
        <p>We can fix these issues automatically. Start your free trial at
        <a href="https://zintas.ai/sign-up">zintas.ai/sign-up</a>.</p>
        <p>&mdash; The Zintas AI Team</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
