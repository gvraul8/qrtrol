import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { UserProfile } from '@/types/auth.types'

export class EmployeeService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await this.supabase
      .from('users')
      .select()
      .eq('id', userId)
      .single()

    return data ?? null
  }

  async getCompanyEmployees(companyId: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select()
      .eq('company_id', companyId)
      .order('full_name')

    if (error) throw new Error(`Error al obtener empleados: ${error.message}`)
    return data ?? []
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>
  ): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(`Error al actualizar perfil: ${error.message}`)
    return data
  }

  async deleteEmployee(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw new Error(`Error al eliminar empleado: ${error.message}`)
  }
}
