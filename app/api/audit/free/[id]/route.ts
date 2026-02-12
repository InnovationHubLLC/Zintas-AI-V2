import { NextRequest, NextResponse } from 'next/server'
import { getLeadById } from '@packages/db/queries'
import type { Finding } from '@packages/audit-engine'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const auditResults = lead.audit_results as {
      score?: number
      grade?: string
      findings?: Finding[]
    }

    const findings = auditResults.findings ?? []
    const responseFindings = lead.email
      ? findings
      : findings.map(({ recommendation: _, ...rest }) => rest)

    return NextResponse.json({
      id: lead.id,
      domain: lead.domain,
      score: auditResults.score ?? lead.audit_score,
      grade: auditResults.grade,
      findings: responseFindings,
      createdAt: lead.created_at,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to get audit results' }, { status: 500 })
  }
}
