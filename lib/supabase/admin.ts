import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Privileged Supabase client using the service role key.
 * ONLY call this in trusted server-side code (API routes, server actions).
 * NEVER import or expose this on the client side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Split by newlines and take the first non-empty line to handle env vars
  // that were accidentally pasted with line breaks or duplicate values.
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').split(/[\r\n]+/)[0].trim()

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
