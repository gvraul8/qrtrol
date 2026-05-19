import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPageClient } from './SettingsPageClient'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single()
  if (!company) redirect('/login')

  return <SettingsPageClient company={company} />
}
