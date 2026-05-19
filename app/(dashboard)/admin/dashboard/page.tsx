import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardPageClient } from './DashboardPageClient'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { WeeklyHoursChart } from '@/components/admin/charts/WeeklyHoursChart'
import type { TimeEntry, ActiveWorker } from '@/types/time-entry.types'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const companyId = profile.company_id

  const [{ data: company }, { data: todayEntriesRaw }, { count: employeeCount }, { data: weekEntriesRaw }] =
    await Promise.all([
      supabase
        .from('companies')
        .select('id, name, logo_url, qr_duration_seconds')
        .eq('id', companyId)
        .single(),
      supabase
        .from('time_entries')
        .select('*, users(full_name, email, avatar_url)')
        .eq('company_id', companyId)
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'employee'),
      supabase
        .from('time_entries')
        .select('user_id, type, created_at')
        .eq('company_id', companyId)
        .gte('created_at', (() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d.toISOString() })())
        .order('created_at', { ascending: true }),
    ])

  const todayEntries = todayEntriesRaw ?? []

  // Active now: first seen entry type per user today
  const seenUsers = new Set<string>()
  let activeNow = 0
  const initialWorkers: ActiveWorker[] = []
  for (const e of todayEntries) {
    if (!seenUsers.has(e.user_id)) {
      seenUsers.add(e.user_id)
      if (e.type === 'entry') {
        activeNow++
        initialWorkers.push({
          id: e.user_id,
          company_id: companyId,
          full_name: (e as TimeEntry).users?.full_name ?? 'Empleado',
          email: (e as TimeEntry).users?.email ?? '',
          avatar_url: (e as TimeEntry).users?.avatar_url ?? null,
          checked_in_at: e.created_at,
        })
      }
    }
  }

  // Weekly hours chart data
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const dayMap = new Map<string, { day: string; minutes: number }>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayMap.set(d.toISOString().slice(0, 10), { day: days[d.getDay()], minutes: 0 })
  }
  const userDayMap = new Map<string, typeof weekEntriesRaw>()
  for (const e of weekEntriesRaw ?? []) {
    const key = `${e.user_id}:${e.created_at.slice(0, 10)}`
    if (!userDayMap.has(key)) userDayMap.set(key, [])
    userDayMap.get(key)!.push(e)
  }
  for (const [key, entries] of userDayMap) {
    const dayKey = key.split(':')[1]
    const dayData = dayMap.get(dayKey)
    if (!dayData || !entries) continue
    for (let i = 0; i < entries.length - 1; i++) {
      if (entries[i].type === 'entry' && entries[i + 1].type === 'exit') {
        const ms = new Date(entries[i + 1].created_at).getTime() - new Date(entries[i].created_at).getTime()
        dayData.minutes += Math.round(ms / 60000)
      }
    }
  }
  const weeklyHours = Array.from(dayMap.values()).map(d => ({
    day: d.day,
    hours: Math.round(d.minutes / 60 * 10) / 10,
  }))

  // Average worked minutes today: pair entry+exit per user
  const userTodayMap = new Map<string, typeof todayEntries>()
  for (const e of [...todayEntries].reverse()) { // ascending order
    if (!userTodayMap.has(e.user_id)) userTodayMap.set(e.user_id, [])
    userTodayMap.get(e.user_id)!.push(e)
  }
  let totalWorkedMinutes = 0
  let usersWithTime = 0
  for (const [, entries] of userTodayMap) {
    let userMinutes = 0
    for (let i = 0; i < entries.length - 1; i++) {
      if (entries[i].type === 'entry' && entries[i + 1].type === 'exit') {
        const ms = new Date(entries[i + 1].created_at).getTime() - new Date(entries[i].created_at).getTime()
        userMinutes += Math.round(ms / 60000)
      }
    }
    if (userMinutes > 0) { totalWorkedMinutes += userMinutes; usersWithTime++ }
  }
  const avgMinutes = usersWithTime > 0 ? Math.round(totalWorkedMinutes / usersWithTime) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageClient
        companyId={company?.id ?? companyId}
        companyName={company?.name ?? 'QRtrol'}
        durationSeconds={company?.qr_duration_seconds ?? 20}
        logoUrl={company?.logo_url ?? null}
        initialWorkers={initialWorkers}
      />

      <StatsCards
        totalEmployees={employeeCount ?? 0}
        entriesTotal={todayEntries.length}
        activeNow={activeNow}
        avgMinutesToday={avgMinutes}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Actividad reciente</h2>
          <RecentActivity entries={todayEntries.slice(0, 8) as TimeEntry[]} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Horas esta semana</h2>
          <WeeklyHoursChart data={weeklyHours} />
        </div>
      </div>
    </div>
  )
}
