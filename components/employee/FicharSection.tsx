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

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${
      open
        ? 'border-blue-300 bg-blue-50 dark:border-blue-700/60 dark:bg-blue-950/30'
        : 'border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60'
    }`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-5 md:py-4 text-left transition-colors hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-zinc-800/40 dark:active:bg-zinc-800/60"
      >
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 md:h-11 md:w-11 items-center justify-center rounded-2xl md:rounded-full transition-colors ${
            open ? 'bg-blue-600' : 'bg-blue-600/20'
          }`}>
            <ScanLine className={`h-7 w-7 md:h-5 md:w-5 transition-colors ${open ? 'text-white' : 'text-blue-400'}`} />
          </div>
          <div>
            <p className="text-base md:text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fichar ahora</p>
            <p className="text-sm md:text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
              {isActive ? 'Registra tu salida' : 'Registra tu entrada'}
            </p>
          </div>
        </div>
        {open
          ? <X className="h-5 w-5 md:h-4 md:w-4 text-zinc-500 flex-shrink-0" />
          : <span className="text-sm md:text-xs font-medium text-blue-400 flex-shrink-0">Escanear →</span>
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scanner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-1 border-t border-gray-200 dark:border-zinc-800">
              <QRScanner
                autoStart
                onSuccess={() => {
                  setOpen(false)
                  setTimeout(() => router.refresh(), 1800)
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
