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
  })
}
