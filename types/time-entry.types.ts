import type { EntryType } from './database.types'

export interface TimeEntry {
  id: string
  user_id: string
  company_id: string
  qr_session_id: string | null
  type: EntryType
  created_at: string
  users?: {
    full_name: string
    email: string
    avatar_url: string | null
  }
}

export interface ActiveWorker {
  id: string
  company_id: string
  full_name: string
  email: string
  avatar_url: string | null
  checked_in_at: string
}

export interface WorkSummary {
  user_id: string
  full_name: string
  date: string
  entry_time: string | null
  exit_time: string | null
  duration_minutes: number | null
}
