import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { QRSession } from '@/types/qr.types'
import { generateQRToken, getTokenExpiry } from '@/lib/qr/generate'

export class QRService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async createSession(
    companyId: string,
    durationSeconds = 20
  ): Promise<QRSession> {
    const token = generateQRToken()
    const expiresAt = getTokenExpiry(durationSeconds)

    const { data, error } = await this.supabase
      .from('qr_sessions')
      .insert({
        company_id: companyId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create QR session: ${error.message}`)
    return data
  }

  async getSession(token: string): Promise<QRSession | null> {
    const { data } = await this.supabase
      .from('qr_sessions')
      .select()
      .eq('token', token)
      .single()

    return data ?? null
  }

  async markUsed(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('qr_sessions')
      .update({ used: true })
      .eq('id', sessionId)

    if (error) throw new Error(`Failed to mark session used: ${error.message}`)
  }
}
