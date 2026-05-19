import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'
import { mockSupabaseClient } from './mock'

// Use in Server Components, Route Handlers, and Server Actions.
// cookies() is async in Next.js 16.
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return mockSupabaseClient

  const cookieStore = await cookies()

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: options?.maxAge ?? 60 * 60 * 24 * 30,
              })
            )
          } catch {
            // Server Component context: cookies are read-only.
            // Mutations must happen in middleware or Route Handlers.
          }
        },
      },
    }
  )
}
