import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { History } from 'lucide-react'
import { MOCK_MY_ENTRIES, MOCK_CURRENT_EMPLOYEE } from '@/lib/mock-data'
import { DownloadSection } from '@/components/employee/DownloadSection'

export default function EmployeeHistoryPage() {
  const entries = MOCK_MY_ENTRIES
  const profile = MOCK_CURRENT_EMPLOYEE

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
