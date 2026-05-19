import { ReportsPageClient } from './ReportsPageClient'
import { MOCK_ENTRIES, MOCK_COMPANY } from '@/lib/mock-data'

export default function AdminReportsPage() {
  const sorted = [...MOCK_ENTRIES].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  return (
    <ReportsPageClient
      initialEntries={sorted}
      companyId={MOCK_COMPANY.id}
    />
  )
}
