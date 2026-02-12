import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { encryptTokens } from '@packages/db/encryption'
import type { GoogleTokens } from '@packages/db/encryption'
import { getClientByOrgId, updateClient } from '@packages/db/queries/clients'

interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
  token_type: string
}

interface ScopeCheckResult {
  gsc: boolean
  ga: boolean
  gbp: boolean
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? '',
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${errorBody}`)
  }

  return response.json() as Promise<GoogleTokenResponse>
}

async function checkScopes(accessToken: string): Promise<ScopeCheckResult> {
  const result: ScopeCheckResult = { gsc: false, ga: false, gbp: false }
  const headers = { Authorization: `Bearer ${accessToken}` }

  try {
    const gscResponse = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      { headers }
    )
    result.gsc = gscResponse.ok
  } catch {
    result.gsc = false
  }

  try {
    const gaResponse = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      { headers }
    )
    result.ga = gaResponse.ok
  } catch {
    result.ga = false
  }

  try {
    const gbpResponse = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      { headers }
    )
    result.gbp = gbpResponse.ok
  } catch {
    result.gbp = false
  }

  return result
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult

    const { userId, orgId } = authResult

    // Handle error from Google (user denied permission)
    const error = request.nextUrl.searchParams.get('error')
    if (error) {
      const redirectUrl = new URL('/onboarding/start?step=3&google=error', request.url)
      redirectUrl.searchParams.set('error_reason', error)
      return NextResponse.redirect(redirectUrl)
    }

    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      )
    }

    // CSRF protection: verify state matches authenticated userId
    if (state !== userId) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 403 }
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(code)

    const tokens: GoogleTokens = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expiry_date: Date.now() + tokenResponse.expires_in * 1000,
      scope: tokenResponse.scope,
    }

    // Encrypt tokens before storage
    const encryptedTokens = encryptTokens(tokens)

    // Get client and update with tokens
    const client = await getClientByOrgId(orgId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    await updateClient(client.id, {
      google_tokens: { encrypted: encryptedTokens },
      account_health: 'active',
    })

    // Test each scope with lightweight API calls
    const scopeResults = await checkScopes(tokenResponse.access_token)

    // Redirect to step 3 with connection status
    const redirectUrl = new URL(
      '/onboarding/start?step=3&google=connected',
      request.url
    )
    redirectUrl.searchParams.set('gsc', String(scopeResults.gsc))
    redirectUrl.searchParams.set('ga', String(scopeResults.ga))
    redirectUrl.searchParams.set('gbp', String(scopeResults.gbp))

    return NextResponse.redirect(redirectUrl)
  } catch {
    const redirectUrl = new URL(
      '/onboarding/start?step=3&google=error',
      request.url
    )
    return NextResponse.redirect(redirectUrl)
  }
}
