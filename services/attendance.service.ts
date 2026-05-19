import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { TimeEntry, ActiveWorker } from '@/types/time-entry.types'
import type { QRValidateRequest } from '@/types/qr.types'
import { isTokenValid, isTokenExpired } from '@/lib/qr/validate'

export class TimeEntryService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async registerEntry(
    userId: string,
    companyId: string,
    request: QRValidateRequest
  ): Promise<TimeEntry> {
    if (!isTokenValid(request.token)) {
      throw new Error('Formato de token inválido')
    }

    const { data: session, error: sessionError } = await this.supabase
      .from('qr_sessions')
      .select()
      .eq('token', request.token)
      .eq('company_id', companyId)
      .single()

    if (sessionError || !session) throw new Error('Código QR no encontrado')
    if (session.used) throw new Error('Código QR ya utilizado')
    if (isTokenExpired(session.expires_at)) throw new Error('Código QR expirado')

    const { data, error } = await this.supabase
      .from('time_entries')
      .insert({
        user_id: userId,
        company_id: companyId,
        qr_session_id: session.id,
        type: request.type,
      })
      .select()
      .single()

    if (error) throw new Error(`Error al registrar fichaje: ${error.message}`)

    // Mark session as used
    await this.supabase
      .from('qr_sessions')
      .update({ used: true })
      .eq('id', session.id)

    return data
  }

  async getEntriesByCompany(
    companyId: string,
    from?: string,
    to?: string
  ): Promise<TimeEntry[]> {
    let query = this.supabase
      .from('time_entries')
      .select('*, users(full_name, email, avatar_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data, error } = await query
    if (error) throw new Error(`Error al obtener registros: ${error.message}`)
    return (data as TimeEntry[]) ?? []
  }

  async getEntriesByUser(userId: string, limit = 50): Promise<TimeEntry[]> {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Error al obtener historial: ${error.message}`)
    return data ?? []
  }

  async getActiveWorkers(companyId: string): Promise<ActiveWorker[]> {
    // Workers whose last entry is type='entry'
    const { data: users } = await this.supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('company_id', companyId)
      .eq('role', 'employee')

    if (!users?.length) return []

    const active: ActiveWorker[] = []

    for (const user of users) {
      const { data: lastEntry } = await this.supabase
        .from('time_entries')
        .select('type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastEntry?.type === 'entry') {
        active.push({
          ...user,
          company_id: companyId,
          checked_in_at: lastEntry.created_at,
        })
      }
    }

    return active
  }
}
