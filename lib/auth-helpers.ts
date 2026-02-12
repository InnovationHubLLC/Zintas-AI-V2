import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

type OrgRole = 'org:manager' | 'org:practice_owner'

interface AuthResult {
  userId: string
  orgId: string
  orgRole: string
}

/**
 * Require authenticated user (no specific role).
 * Returns AuthResult on success, NextResponse (401) on failure.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    userId,
    orgId: orgId ?? '',
    orgRole: (orgRole as string) ?? '',
  }
}

/**
 * Require authenticated user with a specific org role.
 * Returns AuthResult on success, NextResponse (401/403) on failure.
 */
export async function requireRole(role: OrgRole): Promise<AuthResult | NextResponse> {
  const { userId, orgId, orgRole } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  if (orgRole !== role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId, orgId, orgRole: orgRole as string }
}

/**
 * Require valid AGENT_API_KEY header for agent-internal routes.
 * Returns null on success, NextResponse (401) on failure.
 */
export function requireAgentKey(request: Request): NextResponse | null {
  const apiKey = request.headers.get('x-agent-api-key')
  if (apiKey !== process.env.AGENT_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
