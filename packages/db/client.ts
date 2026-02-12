import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/**
 * Creates a Supabase client scoped to the current user's session via cookies.
 * Uses RLS — queries are filtered by the JWT org_id claim.
 * Use this for all user-facing requests.
 */
export function supabaseServer(): SupabaseClient {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll(): { name: string; value: string }[] {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: {
          name: string
          value: string
          options: Record<string, unknown>
        }[]
      ): void {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll can be called from a Server Component where
          // cookies cannot be set. This is expected and safe to ignore
          // because the middleware will refresh the session.
        }
      },
    },
  })
}

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use ONLY for agent/server operations.
 * This is a singleton instance.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
