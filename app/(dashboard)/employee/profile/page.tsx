import { ProfilePageClient } from './ProfilePageClient'
import { MOCK_CURRENT_EMPLOYEE } from '@/lib/mock-data'

export default function EmployeeProfilePage() {
  return <ProfilePageClient profile={MOCK_CURRENT_EMPLOYEE} />
}
