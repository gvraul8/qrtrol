'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ScanState = 'idle' | 'scanning' | 'confirming' | 'success' | 'error'

interface Props {
  onSuccess?: (type: 'entry' | 'exit') => void
  autoStart?: boolean
}

export function QRScanner({ onSuccess, autoStart }: Props) {
  const [state, setState] = useState<ScanState>('idle')
  const [scannedToken, setScannedToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startScan = async () => {
    setState('scanning')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-scanner-container')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          // Extract token from URL (/scan/{token}) or use raw value
          const match = decoded.match(/\/scan\/([a-f0-9-]{36})/)
          const token = match ? match[1] : decoded
          handleScanned(token, scanner)
        },
        () => {} // ignore intermediate errors
      )
    } catch {
      setState('idle')
      toast.error('No se pudo acceder a la cámara')
    }
  }

  const handleScanned = async (token: string, scanner: any) => {
    try {
      await scanner.stop()
    } catch {}
    scannerRef.current = null
    setScannedToken(token)
    setState('confirming')
  }

  const registerEntry = async (type: 'entry' | 'exit') => {
    if (!scannedToken) return
    setState('scanning') // loading state
    try {
      const res = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedToken, type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al fichar')
      setMessage(data.message ?? '¡Fichaje registrado!')
      setState('success')
      onSuccess?.(type)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al registrar')
      setState('error')
    }
  }

  const reset = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScannedToken(null)
    setMessage('')
    setState('idle')
  }

  // Auto-start camera when requested
  useEffect(() => {
    if (autoStart) startScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop() } catch {}
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50">
              <Camera className="h-12 w-12 text-zinc-600" />
            </div>
            <Button onClick={startScan} size="lg" className="gap-2">
              <Camera className="h-4 w-4" />
              Escanear QR
            </Button>
          </motion.div>
        )}

        {state === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <div
              id="qr-scanner-container"
              ref={containerRef}
              className="w-full overflow-hidden rounded-xl border border-zinc-700"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="mt-3 w-full gap-2 text-zinc-400"
            >
              <CameraOff className="h-4 w-4" />
              Cancelar
            </Button>
          </motion.div>
        )}

        {state === 'confirming' && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <p className="text-sm text-zinc-300 text-center">
              QR escaneado. ¿Qué deseas registrar?
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                size="lg"
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => registerEntry('entry')}
              >
                <LogIn className="h-4 w-4" />
                Entrada
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                onClick={() => registerEntry('exit')}
              >
                <LogOut className="h-4 w-4" />
                Salida
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={reset} className="text-zinc-500">
              Cancelar
            </Button>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-900/40 border-2 border-emerald-500/50">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <p className="text-base font-semibold text-emerald-400 text-center">{message}</p>
            <Button variant="outline" onClick={reset} className="mt-2">
              Escanear otro
            </Button>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-900/40 border-2 border-red-500/50">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>
            <p className="text-base font-semibold text-red-400 text-center">{message}</p>
            <Button variant="outline" onClick={reset} className="mt-2">
              Intentar de nuevo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
