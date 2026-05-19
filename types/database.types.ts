export type UserRole = 'admin' | 'employee'
export type EntryType = 'entry' | 'exit'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          address: string | null
          qr_duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          address?: string | null
          qr_duration_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          address?: string | null
          qr_duration_seconds?: number
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          company_id: string
          role: UserRole
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          company_id: string
          role?: UserRole
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          role?: UserRole
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      qr_sessions: {
        Row: {
          id: string
          company_id: string
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'qr_sessions_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          }
        ]
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          company_id: string
          qr_session_id: string | null
          type: EntryType
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          qr_session_id?: string | null
          type: EntryType
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          qr_session_id?: string | null
          type?: EntryType
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'time_entries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_qr_session_id_fkey'
            columns: ['qr_session_id']
            isOneToOne: false
            referencedRelation: 'qr_sessions'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

