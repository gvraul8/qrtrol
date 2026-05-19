'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CameraOff, CheckCircle2, XCircle, LogIn, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ScanState = 'idle' | 'scanning' | 'confirming' | 'success' | 'error'

interface Props {
  onSuccess?: (type: 'entry' | 'exit') => void
  autoStart?: boolean
  fullscreen?: boolean
  onClose?: () => void
}

export function QRScanner({ onSuccess, autoStart, fullscreen, onClose }: Props) {
  const [state, setState] = useState<ScanState>(autoStart ? 'scanning' : 'idle')
  const [scannedToken, setScannedToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const scannerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // startScan only sets state — the useEffect below does the actual init
  // once React has committed the DOM with #qr-scanner-container present.
  const startScan = () => setState('scanning')

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
    setState('scanning') // triggers loading overlay (scannedToken still set)
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

  // Initialize the camera AFTER React has rendered #qr-scanner-container.
  // Only runs when state === 'scanning' and no token is pending validation.
  useEffect(() => {
    if (state !== 'scanning' || scannedToken !== null) return

    let cancelled = false

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        // Ensure any previous instance is fully stopped before creating a new one
        if (scannerRef.current) {
          try { await scannerRef.current.stop() } catch {}
          scannerRef.current = null
        }

        const scanner = new Html5Qrcode('qr-scanner-container')
        if (cancelled) return
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: fullscreen ? { width: 280, height: 280 } : { width: 240, height: 240 } },
          (decoded) => {
            const match = decoded.match(/\/scan\/([a-f0-9-]{36})/)
            const token = match ? match[1] : decoded
            handleScanned(token, scanner)
          },
          () => {}
        )
      } catch {
        if (!cancelled) {
          setState('idle')
          toast.error('No se pudo acceder a la cámara')
        }
      }
    }

    initScanner()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, scannedToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop() } catch {}
      }
    }
  }, [])

  // ── FULLSCREEN MODE ──────────────────────────────────────────────────
  if (fullscreen) {
    // When registerEntry is called, state goes back to 'scanning' with scannedToken set
    const isValidating = state === 'scanning' && scannedToken !== null

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">

          {(state === 'idle' || state === 'scanning') && (
            <motion.div
              key="fs-camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
            >
              <div
                id="qr-scanner-container"
                ref={containerRef}
                className="w-full"
                style={{ height: 'calc(100dvh - 64px)' }}
              />
              {/* Idle: camera not started yet */}
              {state === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="h-14 w-14 text-zinc-600 animate-pulse" />
                    <p className="text-zinc-500 text-sm">Iniciando cámara…</p>
                  </div>
                </div>
              )}
              {/* Validating spinner overlay */}
              {isValidating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 text-white animate-spin" />
                    <p className="text-zinc-400 text-sm">Registrando fichaje…</p>
                  </div>
                </div>
              )}
              {/* Cancel button */}
              {!isValidating && (
                <button
                  onClick={() => { reset(); onClose?.() }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/70 text-sm flex items-center gap-2 transition-colors"
                >
                  <CameraOff className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </motion.div>
          )}

          {state === 'confirming' && (
            <motion.div
              key="fs-confirming"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-900/40 border-2 border-blue-500/40">
                <CheckCircle2 className="h-10 w-10 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-white text-2xl font-bold">QR escaneado</p>
                <p className="text-zinc-400 text-sm mt-1">¿Qué deseas registrar?</p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={() => registerEntry('entry')}
                  className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-lg font-semibold transition-colors"
                >
                  <LogIn className="h-6 w-6" />
                  Entrada
                </button>
                <button
                  onClick={() => registerEntry('exit')}
                  className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-white text-lg font-semibold border border-zinc-700 transition-colors"
                >
                  <LogOut className="h-6 w-6" />
                  Salida
                </button>
              </div>
              <button
                onClick={() => { reset(); onClose?.() }}
                className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div
              key="fs-success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 18 }}
                className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-900/40 border-2 border-emerald-500/50"
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-400" />
              </motion.div>
              <p className="text-2xl font-bold text-emerald-400 text-center">{message}</p>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="fs-error"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 px-8"
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-red-900/40 border-2 border-red-500/50">
                <XCircle className="h-16 w-16 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400 text-center">{message}</p>
              <button
                onClick={reset}
                className="px-8 py-3 rounded-2xl border border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-base transition-colors"
              >
                Intentar de nuevo
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    )
  }

  // ── INLINE MODE (página de escaneo) ─────────────────────────────────
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
