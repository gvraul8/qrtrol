import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReportsPageClient } from './ReportsPageClient'
import type { TimeEntry } from '@/types/time-entry.types'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, users(full_name, email, avatar_url)')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(500)

  return (
    <ReportsPageClient
      initialEntries={(entries ?? []) as TimeEntry[]}
      companyId={profile.company_id}
    />
  )
}
