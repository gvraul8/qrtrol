'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanLine, X } from 'lucide-react'
import { QRScanner } from '@/components/employee/QRScanner'

interface Props {
  isActive: boolean
}

export function FicharSection({ isActive }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleClose = () => setOpen(false)

  return (
    <>
      {/* Trigger card */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden">
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-5 py-5 md:py-4 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-zinc-800/40 dark:active:bg-zinc-800/60"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 md:h-11 md:w-11 items-center justify-center rounded-2xl md:rounded-full bg-blue-600/20">
              <ScanLine className="h-7 w-7 md:h-5 md:w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-base md:text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fichar ahora</p>
              <p className="text-sm md:text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                {isActive ? 'Registra tu salida' : 'Registra tu entrada'}
              </p>
            </div>
          </div>
          <span className="text-sm md:text-xs font-medium text-blue-400 flex-shrink-0">Escanear →</span>
        </button>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="scanner-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 pt-safe shrink-0">
              <p className="text-white text-base font-semibold">Fichar</p>
              <button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scanner */}
            <div className="flex-1 flex flex-col min-h-0">
              <QRScanner
                autoStart
                fullscreen
                onClose={handleClose}
                onSuccess={() => {
                  setTimeout(() => {
                    handleClose()
                    router.refresh()
                  }, 1800)
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
