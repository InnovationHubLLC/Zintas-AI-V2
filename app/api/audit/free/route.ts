import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { createLead } from '@packages/db/queries'
import { auditRateLimiter, checkRateLimit } from '@packages/db/rate-limit'
import { runAudit } from '@packages/audit-engine'
import type { Finding } from '@packages/audit-engine'

const FreeAuditSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  email: z.string().email().optional(),
  recaptchaToken: z.string().min(1, 'reCAPTCHA token is required'),
})

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

function redactFindings(findings: Finding[]): Array<Omit<Finding, 'recommendation'>> {
  return findings.map(({ recommendation: _, ...rest }) => rest)
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') return true
    throw new Error('RECAPTCHA_SECRET_KEY is not configured')
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  })

  const data = (await response.json()) as { success: boolean }
  return data.success
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '127.0.0.1'

    const rateLimitResult = await checkRateLimit(auditRateLimiter, ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      )
    }

    const body = FreeAuditSchema.parse(await request.json())

    const isValid = await verifyRecaptcha(body.recaptchaToken)
    if (!isValid) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 })
    }

    const auditResult = await runAudit(body.url)

    const domain = new URL(
      body.url.startsWith('http') ? body.url : `https://${body.url}`
    ).hostname

    const lead = await createLead({
      domain,
      email: body.email ?? null,
      audit_score: auditResult.score,
      audit_results: auditResult as unknown as Record<string, unknown>,
      converted: false,
      converted_at: null,
      source: request.headers.get('referer') ?? 'direct',
      ip_hash: hashIp(ip),
    })

    // Send email if provided (fire-and-forget)
    if (body.email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const { AuditResultsEmail } = await import('@packages/audit-engine/emails/audit-results')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Zintas AI <audit@zintas.ai>',
          to: body.email,
          subject: `Your SEO Audit: Score ${auditResult.score}/100 (Grade ${auditResult.grade})`,
          react: AuditResultsEmail({
            score: auditResult.score,
            grade: auditResult.grade,
            findings: auditResult.findings,
            auditId: lead.id,
          }),
        })
      } catch {
        // Email failure should not block the response
      }
    }

    const responseFindings = body.email
      ? auditResult.findings
      : redactFindings(auditResult.findings)

    return NextResponse.json({
      id: lead.id,
      score: auditResult.score,
      grade: auditResult.grade,
      findings: responseFindings,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to run audit' }, { status: 500 })
  }
}
