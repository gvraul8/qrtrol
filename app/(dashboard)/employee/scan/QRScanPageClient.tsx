'use client'

import { useRouter } from 'next/navigation'
import { QRScanner } from '@/components/employee/QRScanner'
import { ScanLine } from 'lucide-react'

export function QRScanPageClient() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-sm animate-fade-in space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-blue-400" />
          Escanear QR
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Apunta la cámara al QR que muestra el administrador
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <QRScanner onSuccess={() => setTimeout(() => router.push('/employee/dashboard'), 2000)} />
      </div>
    </div>
  )
}
