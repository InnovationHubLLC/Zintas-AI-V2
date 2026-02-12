import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-helpers'
import { getClientByOrgId, getContentByClient } from '@packages/db/queries'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireRole('org:practice_owner')
    if (authResult instanceof NextResponse) return authResult

    const client = await getClientByOrgId(authResult.orgId)
    if (!client) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 })
    }

    const status = request.nextUrl.searchParams.get('status') as 'draft' | 'in_review' | 'approved' | 'published' | 'rejected' | null
    const type = request.nextUrl.searchParams.get('type') as 'blog_post' | 'service_page' | 'faq' | 'gbp_post' | null

    const content = await getContentByClient(client.id, {
      status: status || undefined,
      type: type || undefined,
    })

    return NextResponse.json(content)
  } catch {
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 })
  }
}
