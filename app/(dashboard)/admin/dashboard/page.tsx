import { DashboardPageClient } from './DashboardPageClient'
import { StatsCards } from '@/components/admin/StatsCards'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { WeeklyHoursChart } from '@/components/admin/charts/WeeklyHoursChart'
import { MOCK_ENTRIES, MOCK_ACTIVE_WORKERS, MOCK_WEEKLY_HOURS, MOCK_EMPLOYEES, MOCK_COMPANY } from '@/lib/mock-data'
import type { TimeEntry } from '@/types/time-entry.types'

export default function AdminDashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEntries = MOCK_ENTRIES.filter(
    (e) => new Date(e.created_at) >= today
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const entriesCount = todayEntries.filter((e) => e.type === 'entry').length
  const avgMinutes = entriesCount > 0
    ? Math.round((Date.now() - today.getTime()) / 1000 / 60 / entriesCount)
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardPageClient
        companyId={MOCK_COMPANY.id}
        companyName={MOCK_COMPANY.name}
        durationSeconds={MOCK_COMPANY.qr_duration_seconds}
        logoUrl={MOCK_COMPANY.logo_url}
      />

      <StatsCards
        totalEmployees={MOCK_EMPLOYEES.length}
        entriesTotal={todayEntries.length}
        activeNow={MOCK_ACTIVE_WORKERS.length}
        avgMinutesToday={avgMinutes}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Actividad reciente</h2>
          <RecentActivity entries={todayEntries.slice(0, 8) as TimeEntry[]} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Horas esta semana</h2>
          <WeeklyHoursChart data={MOCK_WEEKLY_HOURS} />
        </div>
      </div>
    </div>
  )
}
