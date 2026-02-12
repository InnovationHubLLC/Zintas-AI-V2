import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    // TODO: Generate Google OAuth URL with GSC + GA scopes (TASK-15)
    // TODO: Store state parameter for CSRF protection
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?TODO`

    return NextResponse.json({ url: oauthUrl })
  } catch {
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
