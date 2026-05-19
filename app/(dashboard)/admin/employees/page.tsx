import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmployeesPageClient } from './EmployeesPageClient'

export default async function AdminEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const [{ data: employees }, { data: entries }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('full_name', { ascending: true }),
    supabase
      .from('time_entries')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  return (
    <EmployeesPageClient
      initialEmployees={employees ?? []}
      companyId={profile.company_id}
      initialEntries={entries ?? []}
    />
  )
}
