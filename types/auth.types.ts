import type { User } from '@supabase/supabase-js'
import type { UserRole } from './database.types'

export interface UserProfile {
  id: string
  company_id: string
  role: UserRole
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

export interface AuthState {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
}
