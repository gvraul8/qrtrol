import { SettingsPageClient } from './SettingsPageClient'
import { MOCK_COMPANY } from '@/lib/mock-data'

export default function AdminSettingsPage() {
  return <SettingsPageClient company={MOCK_COMPANY} />
}
