import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { mockSupabaseClient } from './mock'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return mockSupabaseClient

  return createBrowserClient<Database>(url, key, {
    cookieOptions: {
      // 30-day persistent session — survives browser restarts
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
}
