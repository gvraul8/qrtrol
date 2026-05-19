import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { WeekStats } from '@/components/employee/WeekStats'
import { FicharSection } from '@/components/employee/FicharSection'
import { formatDateTime } from '@/lib/utils'
import { CheckCircle2, Clock } from 'lucide-react'

export default async function EmployeeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)

  const { data: weekEntriesRaw } = await supabase
    .from('time_entries')
    .select('id, user_id, company_id, qr_session_id, type, created_at')
    .eq('user_id', user.id)
    .gte('created_at', weekStart.toISOString())
    .order('created_at', { ascending: true })

  const { data: recentEntriesRaw } = await supabase
    .from('time_entries')
    .select('id, user_id, company_id, qr_session_id, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const weekEntries = weekEntriesRaw ?? []
  const recentEntries = recentEntriesRaw ?? []
  const lastEntry = recentEntries[0]
  const isActive = lastEntry?.type === 'entry'

  let totalMinutes = 0
  for (let i = 0; i < weekEntries.length - 1; i++) {
    if (weekEntries[i].type === 'entry' && weekEntries[i + 1].type === 'exit') {
      const ms = new Date(weekEntries[i + 1].created_at).getTime() - new Date(weekEntries[i].created_at).getTime()
      totalMinutes += Math.round(ms / 60000)
    }
  }
  const entriesThisWeek = weekEntries.filter((e) => e.type === 'entry').length
  const avgDailyMinutes = entriesThisWeek > 0 ? Math.round(totalMinutes / entriesThisWeek) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Hola, {profile.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-zinc-500">Tu resumen semanal</p>
      </div>

      <FicharSection isActive={isActive} />

      <div className={`flex items-center gap-4 rounded-xl border p-4 ${
        isActive
          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-900/20'
          : 'border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40'
      }`}>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${
          isActive ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-gray-100 dark:bg-zinc-800'
        }`}>
          {isActive
            ? <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            : <Clock className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          }
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{isActive ? 'Trabajando ahora' : 'Fuera de oficina'}</p>
          {lastEntry && (
            <p className="text-xs text-zinc-500">Último fichaje: {formatDateTime(lastEntry.created_at)}</p>
          )}
        </div>
      </div>

      <WeekStats
        entriesThisWeek={entriesThisWeek}
        hoursThisWeek={Math.floor(totalMinutes / 60)}
        avgDailyMinutes={avgDailyMinutes}
      />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Últimos fichajes</h2>
        <ul className="space-y-2">
          {recentEntries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-zinc-800 last:border-0">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatDateTime(entry.created_at)}</p>
              <Badge variant={entry.type === 'entry' ? 'success' : 'destructive'}>
                {entry.type === 'entry' ? 'Entrada' : 'Salida'}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
