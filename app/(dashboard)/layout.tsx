import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/employee/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id)
    .single()

  const companyName = company?.name ?? 'QRtrol'
  const isEmployee = profile.role === 'employee'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
      <Sidebar role={profile.role} companyName={companyName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} title={companyName} />
        <main className="flex-1 overflow-y-auto">
          <div className={`mx-auto max-w-2xl px-4 py-5 md:max-w-6xl md:px-6 md:py-8 ${
            isEmployee ? 'pb-24 md:pb-8' : ''
          }`}>{children}</div>
        </main>
        {isEmployee && <BottomNav />}
      </div>
    </div>
  )
}
