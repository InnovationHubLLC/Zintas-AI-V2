import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getLeads } from '@packages/db/queries'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:manager')
    if (authResult instanceof NextResponse) return authResult

    const { searchParams } = new URL(request.url)
    const converted = searchParams.get('converted')

    const leads = await getLeads({
      converted: converted === 'true' ? true : converted === 'false' ? false : undefined,
    })

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
