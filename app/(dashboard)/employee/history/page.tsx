import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { History } from 'lucide-react'
import { DownloadSection } from '@/components/employee/DownloadSection'
import type { TimeEntry } from '@/types/time-entry.types'

export default async function EmployeeHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: entriesRaw } = await supabase
    .from('time_entries')
    .select('id, user_id, company_id, qr_session_id, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const entries = (entriesRaw ?? []) as TimeEntry[]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-400 dark:text-zinc-400" />
          Mi historial
        </h1>
        <p className="text-sm text-zinc-500">Últimos 50 fichajes</p>
      </div>

      <DownloadSection entries={entries} employeeName={profile.full_name} />

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Fecha y hora</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDateTime(entry.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge variant={entry.type === 'entry' ? 'success' : 'destructive'}>
                    {entry.type === 'entry' ? 'Entrada' : 'Salida'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
