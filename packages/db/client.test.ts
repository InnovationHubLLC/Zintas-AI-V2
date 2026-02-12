import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

const MOCK_URL = 'https://test.supabase.co'
const MOCK_ANON_KEY = 'test-anon-key'
const MOCK_SERVICE_ROLE_KEY = 'test-service-role-key'

describe('TASK-02: Supabase Client Factories', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_ANON_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = MOCK_SERVICE_ROLE_KEY
  })

  it('should export supabaseServer as a function', async () => {
    const { supabaseServer } = await import('./client')
    expect(typeof supabaseServer).toBe('function')
  })

  it('should export supabaseAdmin as a SupabaseClient instance', async () => {
    const { supabaseAdmin } = await import('./client')
    expect(supabaseAdmin).toBeDefined()
    expect(typeof supabaseAdmin.from).toBe('function')
  })

  it('supabaseServer should return a SupabaseClient', async () => {
    const { supabaseServer } = await import('./client')
    const client = supabaseServer()
    expect(client).toBeDefined()
    expect(typeof client.from).toBe('function')
  })

  it('should throw if NEXT_PUBLIC_SUPABASE_URL is missing for supabaseServer', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_ANON_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = MOCK_SERVICE_ROLE_KEY
    // supabaseAdmin will throw at module load because URL is missing
    await expect(import('./client')).rejects.toThrow()
  })
})
