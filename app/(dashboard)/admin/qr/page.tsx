import { QRPageClient } from './QRPageClient'
import { MOCK_COMPANY } from '@/lib/mock-data'

export default function AdminQRPage() {
  return (
    <QRPageClient
      companyId={MOCK_COMPANY.id}
      companyName={MOCK_COMPANY.name}
      durationSeconds={MOCK_COMPANY.qr_duration_seconds}
    />
  )
}
