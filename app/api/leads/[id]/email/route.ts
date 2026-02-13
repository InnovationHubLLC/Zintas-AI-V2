import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getLeadById } from '@packages/db/queries'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { id } = await params
    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead has no email address' }, { status: 400 })
    }

    const score = lead.audit_score ?? 0

    await resend.emails.send({
      from: 'Zintas AI <hello@zintas.ai>',
      to: lead.email,
      subject: `Your SEO audit for ${lead.domain}: ${score}/100`,
      html: `
        <p>Hi,</p>
        <p>You recently audited <strong>${lead.domain}</strong> and scored <strong>${score}/100</strong>.</p>
        <p>We can fix these issues automatically. Start your free trial at
        <a href="https://zintas.ai/sign-up">zintas.ai/sign-up</a>.</p>
        <p>— The Zintas AI Team</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
