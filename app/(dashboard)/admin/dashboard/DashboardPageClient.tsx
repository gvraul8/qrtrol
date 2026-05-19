'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Users } from 'lucide-react'
import { QRGenerator } from '@/components/admin/QRGenerator'
import { ActiveWorkers } from '@/components/admin/ActiveWorkers'
import { Screensaver } from '@/components/admin/Screensaver'

interface Props {
  companyId: string
  companyName: string
  durationSeconds: number
  logoUrl: string | null
}

const INACTIVITY_MS = 60_000

export function DashboardPageClient({ companyId, companyName, durationSeconds, logoUrl: initialLogoUrl }: Props) {
  const [screensaverActive, setScreensaverActive] = useState(false)
  const [lastActivity, setLastActivity] = useState(0)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [dateStr, setDateStr] = useState('')
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    setLastActivity(Date.now())
    const stored = localStorage.getItem('qrtrol_logo_url')
    if (stored) setLogoUrl(stored)

    const updateTime = () => {
      const now = new Date()
      setDateStr(now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))
      setTimeStr(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const id = setInterval(updateTime, 30_000)
    return () => clearInterval(id)
  }, [])

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
      if (lastActivity > 0 && Date.now() - lastActivity >= INACTIVITY_MS) setScreensaverActive(true)
    }, 5_000)
    return () => clearInterval(id)
  }, [lastActivity])

  return (
    <>
      <Screensaver isActive={screensaverActive} companyName={companyName} logoUrl={logoUrl} />

      <div className="space-y-6 animate-fade-in">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-4 pb-2"
        >
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={companyName}
                className="h-10 w-10 rounded-lg object-contain shrink-0"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">{companyName}</h1>
              {dateStr && <p className="text-sm text-zinc-500 capitalize">{dateStr}</p>}
            </div>
          </div>

          {timeStr && (
            <div className="shrink-0 hidden sm:block text-right">
              <p className="text-3xl font-bold font-mono text-blue-600 dark:text-blue-400 leading-none">{timeStr}</p>
            </div>
          )}
        </motion.div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

          {/* QR Generator — wider */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20">
                <QrCode className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Generar QR de fichaje</h2>
                <p className="text-xs text-zinc-500">Expira en {durationSeconds} segundos</p>
              </div>
            </div>
            <QRGenerator companyId={companyId} durationSeconds={durationSeconds} />
          </motion.div>

          {/* Active Workers */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Trabajando ahora</h2>
                <p className="text-xs text-zinc-500">Empleados activos hoy</p>
              </div>
            </div>
            <ActiveWorkers companyId={companyId} />
          </motion.div>

        </div>
      </div>
    </>
  )
}
