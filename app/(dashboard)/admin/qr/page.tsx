import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QRPageClient } from './QRPageClient'

export default async function AdminQRPage() {
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
    .select('id, name, qr_duration_seconds')
    .eq('id', profile.company_id)
    .single()

  return (
    <QRPageClient
      companyId={company?.id ?? profile.company_id}
      companyName={company?.name ?? 'QRtrol'}
      durationSeconds={company?.qr_duration_seconds ?? 20}
    />
  )
}
