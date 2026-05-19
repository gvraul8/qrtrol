'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  isActive: boolean
  companyName: string
  logoUrl?: string | null
}

function useClock() {
  const [time, setTime] = useState<Date | null>(null)
  useEffect(() => {
    setTime(new Date())
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

export function Screensaver({ isActive, companyName, logoUrl }: Props) {
  const time = useClock()

  const timeStr = time?.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) ?? ''
  const dateStr = time?.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }) ?? ''

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="screensaver"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-sm cursor-none select-none"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            {/* Clock */}
            <p className="text-[5rem] font-bold leading-none tracking-tight text-zinc-50 font-mono">
              {timeStr}
            </p>
            <p className="text-xl text-zinc-400 capitalize">{dateStr}</p>

            {/* Divider */}
            <div className="h-px w-40 bg-zinc-800" />

            {/* Company */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="h-72 w-auto max-w-lg object-contain" />
            ) : (
              <p className="text-lg font-semibold text-zinc-300">{companyName}</p>
            )}

            {/* CTA */}
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 text-sm text-blue-400 tracking-widest uppercase"
            >
              Escanea el QR para fichar
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
