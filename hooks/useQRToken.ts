'use client'

import { useState, useCallback } from 'react'
import type { QRSession as QRToken } from '@/types/qr.types'

interface UseQRTokenReturn {
  qrToken: QRToken | null
  qrDataUrl: string | null
  isLoading: boolean
  error: string | null
  generateToken: (durationMinutes?: number) => Promise<void>
  reset: () => void
}

export function useQRToken(): UseQRTokenReturn {
  const [qrToken, setQRToken] = useState<QRToken | null>(null)
  const [qrDataUrl, setQRDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateToken = useCallback(async (durationMinutes = 5) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_minutes: durationMinutes }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error ?? 'Error al generar el QR')
      }

      const { token, qr_data_url } = await response.json()
      setQRToken(token)
      setQRDataUrl(qr_data_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setQRToken(null)
    setQRDataUrl(null)
    setError(null)
  }, [])

  return { qrToken, qrDataUrl, isLoading, error, generateToken, reset }
}
