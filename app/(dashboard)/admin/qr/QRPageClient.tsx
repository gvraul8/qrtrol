'use client'

import { useState, useEffect, useCallback } from 'react'
import { QRGenerator } from '@/components/admin/QRGenerator'
import { Screensaver } from '@/components/admin/Screensaver'

interface Props {
  companyId: string
  companyName: string
  durationSeconds: number
}

const INACTIVITY_MS = 60_000

export function QRPageClient({ companyId, companyName, durationSeconds }: Props) {
  const [screensaverActive, setScreensaverActive] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
    setScreensaverActive(false)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, resetActivity))
  }, [resetActivity])

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_MS) {
        setScreensaverActive(true)
      }
    }, 5_000)
    return () => clearInterval(id)
  }, [lastActivity])

  return (
    <>
      <Screensaver isActive={screensaverActive} companyName={companyName} />

      <div className="mx-auto max-w-md animate-fade-in">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-50">Generar QR</h1>
          <p className="text-sm text-zinc-500">
            QR dinámico · expira en {durationSeconds} segundos
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <QRGenerator companyId={companyId} durationSeconds={durationSeconds} />
        </div>
      </div>
    </>
  )
}
