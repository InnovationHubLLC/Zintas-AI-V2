import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createLead } from '@packages/db/queries'

const FreeAuditSchema = z.object({
  domain: z.string().min(1),
  email: z.string().email(),
  practiceName: z.string().min(1),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = FreeAuditSchema.parse(await request.json())

    // TODO: Rate limit by IP (TASK-07)
    // TODO: Run audit engine analysis (TASK-09)
    const lead = await createLead({
      domain: body.domain,
      email: body.email,
      audit_score: null,
      audit_results: {},
      converted: false,
      converted_at: null,
      source: 'free_audit',
      ip_hash: null,
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to run audit' }, { status: 500 })
  }
}
