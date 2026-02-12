import { decryptTokens, encryptTokens } from '@packages/db/encryption'
import type { GoogleTokens } from '@packages/db/encryption'
import { getClientById, updateClient } from '@packages/db/queries/clients'

/** Buffer of 5 minutes before actual expiry to avoid race conditions */
const EXPIRY_BUFFER_MS = 5 * 60 * 1000

interface TokenRefreshResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

/**
 * Check if a client's Google access token is expired and refresh if needed.
 * Returns valid decrypted tokens ready for use with Google APIs.
 */
export async function refreshTokenIfNeeded(
  clientId: string
): Promise<GoogleTokens> {
  const client = await getClientById(clientId)
  if (!client) {
    throw new Error(`Client not found: ${clientId}`)
  }

  const storedTokens = client.google_tokens as { encrypted?: string }
  if (!storedTokens?.encrypted) {
    throw new Error(`No Google tokens stored for client: ${clientId}`)
  }

  const tokens = decryptTokens(storedTokens.encrypted)

  // Token is still valid (with buffer)
  if (tokens.expiry_date > Date.now() + EXPIRY_BUFFER_MS) {
    return tokens
  }

  // Token is expired or about to expire — refresh it
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const refreshed = (await response.json()) as TokenRefreshResponse

    const updatedTokens: GoogleTokens = {
      access_token: refreshed.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + refreshed.expires_in * 1000,
      scope: refreshed.scope ?? tokens.scope,
    }

    const encrypted = encryptTokens(updatedTokens)
    await updateClient(clientId, {
      google_tokens: { encrypted },
    })

    return updatedTokens
  } catch {
    await updateClient(clientId, {
      account_health: 'disconnected',
    })
    throw new Error(
      `Failed to refresh Google tokens for client ${clientId}. Account marked as disconnected.`
    )
  }
}

/**
 * Revoke a client's Google tokens and clear them from storage.
 */
export async function revokeTokens(clientId: string): Promise<void> {
  const client = await getClientById(clientId)
  if (!client) {
    throw new Error(`Client not found: ${clientId}`)
  }

  const storedTokens = client.google_tokens as { encrypted?: string }
  if (!storedTokens?.encrypted) {
    return
  }

  const tokens = decryptTokens(storedTokens.encrypted)

  // Revoke at Google
  try {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`,
      { method: 'POST' }
    )
  } catch {
    // Revocation failure is non-fatal
  }

  // Clear stored tokens
  await updateClient(clientId, {
    google_tokens: {},
    account_health: 'disconnected',
  })
}
