'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtimeEntries } from '@/hooks/useRealtime'
import { toast } from 'sonner'

interface Props {
  companyId: string
  durationSeconds?: number
}

export function QRGenerator({ companyId, durationSeconds = 20 }: Props) {
  const router = useRouter()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [justFiched, setJustFiched] = useState(false)
  const [fichedUser, setFichedUser] = useState<string | null>(null)

  const isExpired = secondsLeft <= 0 && qrDataUrl !== null

  // Countdown ticker
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  // Refresh page data when QR expires naturally (no scan detected)
  const qrWasActiveRef = useRef(false)
  useEffect(() => {
    if (qrDataUrl !== null) qrWasActiveRef.current = true
  }, [qrDataUrl])
  useEffect(() => {
    if (secondsLeft === 0 && qrWasActiveRef.current) {
      qrWasActiveRef.current = false
      router.refresh()
    }
  }, [secondsLeft, router])

  const generate = useCallback(async () => {
    setLoading(true)
    setJustFiched(false)
    setFichedUser(null)
    try {
      const res = await fetch('/api/qr/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al generar QR')
      setQrDataUrl(data.qr_data_url)
      setSecondsLeft(durationSeconds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar QR')
    } finally {
      setLoading(false)
    }
  }, [durationSeconds])

  // Realtime: when someone checks in/out, show confirmation
  useRealtimeEntries(companyId, (entry) => {
    setJustFiched(true)
    setFichedUser(null) // name will be fetched if needed
    setQrDataUrl(null)
    setSecondsLeft(0)
    const label = entry.type === 'entry' ? 'Entrada' : 'Salida'
    toast.success(`${label} registrada`, { duration: 4000 })
    setTimeout(() => setJustFiched(false), 4000)
    router.refresh()
  })

  // Progress for countdown ring
  const pct = durationSeconds > 0 ? (secondsLeft / durationSeconds) * 100 : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {justFiched ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-900/40 border-2 border-emerald-500/60">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-emerald-400">¡Fichaje registrado!</p>
          </motion.div>
        ) : qrDataUrl && !isExpired ? (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative flex flex-col items-center gap-4"
          >
            {/* Countdown ring */}
            <div className="relative">
              <svg
                className="absolute inset-0 -rotate-90"
                width="280"
                height="280"
                viewBox="0 0 120 120"
              >
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#27272a" strokeWidth="3" />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={secondsLeft <= 5 ? '#ef4444' : '#3b82f6'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <div className="relative rounded-2xl overflow-hidden border-2 border-zinc-700 m-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR de fichaje" width={256} height={256} />
              </div>
            </div>

            {/* Seconds badge */}
            <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${secondsLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`}>
              <Clock className="h-4 w-4" />
              {secondsLeft}s
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50">
              <RefreshCw className="h-10 w-10 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">
              {isExpired ? 'QR expirado' : 'Sin QR activo'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={generate}
        disabled={loading}
        size="lg"
        className="w-full max-w-xs gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Generando…' : isExpired || !qrDataUrl ? 'Generar QR' : 'Regenerar QR'}
      </Button>

      <p className="text-xs text-zinc-600 text-center max-w-xs">
        Muestra este QR a los empleados para que registren su entrada o salida.
        Expira en {durationSeconds} segundos.
      </p>
    </div>
  )
}
