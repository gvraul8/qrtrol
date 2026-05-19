import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type Company = Database['public']['Tables']['companies']['Row']

export class CompanyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getById(id: string): Promise<Company | null> {
    const { data } = await this.supabase
      .from('companies')
      .select()
      .eq('id', id)
      .single()

    return data ?? null
  }

  async update(
    id: string,
    updates: Partial<Omit<Company, 'id' | 'created_at'>>
  ): Promise<Company> {
    const { data, error } = await this.supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar empresa: ${error.message}`)
    return data
  }
}
