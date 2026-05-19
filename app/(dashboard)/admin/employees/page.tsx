import { EmployeesPageClient } from './EmployeesPageClient'
import { MOCK_ALL_USERS, MOCK_COMPANY, MOCK_ENTRIES } from '@/lib/mock-data'

export default function AdminEmployeesPage() {
  return (
    <EmployeesPageClient
      initialEmployees={MOCK_ALL_USERS}
      companyId={MOCK_COMPANY.id}
      initialEntries={MOCK_ENTRIES}
    />
  )
}
