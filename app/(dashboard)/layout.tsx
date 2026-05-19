import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/employee/BottomNav'
import { MOCK_CURRENT_EMPLOYEE, MOCK_COMPANY } from '@/lib/mock-data'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = MOCK_CURRENT_EMPLOYEE
  const companyName = MOCK_COMPANY.name
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
