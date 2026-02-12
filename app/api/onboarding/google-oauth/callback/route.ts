import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state parameter' }, { status: 400 })
    }

    // TODO: Exchange code for tokens (TASK-15)
    // TODO: Verify state parameter
    // TODO: Encrypt and store tokens in client record
    // TODO: Redirect to next onboarding step

    return NextResponse.redirect(new URL('/onboarding/connect', request.url))
  } catch {
    return NextResponse.json({ error: 'OAuth callback failed' }, { status: 500 })
  }
}
