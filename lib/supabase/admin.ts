import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Privileged Supabase client using the service role key.
 * ONLY call this in trusted server-side code (API routes, server actions).
 * NEVER import or expose this on the client side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      // Workaround: supabase-js v2 middleware layers call Headers.append for
      // Authorization on each pass, causing the token to duplicate when Next.js
      // also patches the global fetch. Reset the header to a single value here.
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${serviceKey}`)
        headers.set('apikey', serviceKey)
        return fetch(input, { ...init, headers })
      },
    },
  })
}
