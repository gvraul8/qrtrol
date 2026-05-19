'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, LogIn, LogOut, Loader2 } from 'lucide-react'

type ScanState = 'idle' | 'loading' | 'success' | 'error'

export default function ScanPage() {
  const params = useParams()
  const token = params.token as string

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [attendanceType, setAttendanceType] = useState<'check_in' | 'check_out' | null>(null)

  const handleScan = async (type: 'check_in' | 'check_out') => {
    setScanState('loading')
    setAttendanceType(type)

    // Require authentication before registering
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Redirect to login, return here after
      window.location.href = `/login?next=/scan/${token}`
      return
    }

    // Optionally gather GPS location
    let locationData: { location_lat?: number; location_lng?: number } = {}
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 })
      )
      locationData = {
        location_lat: position.coords.latitude,
        location_lng: position.coords.longitude,
      }
    } catch {
      // Location optional — proceed without it
    }

    try {
      const response = await fetch('/api/qr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type, ...locationData }),
      })

      const data = await response.json()

      if (!response.ok) {
        setScanState('error')
        setMessage(data.error ?? 'Error al registrar el fichaje')
        return
      }

      setScanState('success')
      setMessage(data.message)
    } catch {
      setScanState('error')
      setMessage('Error de red. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">QRtrol</CardTitle>
          <CardDescription>Registra tu fichaje</CardDescription>
        </CardHeader>
        <CardContent>
          {scanState === 'idle' && (
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full h-14 text-base"
                onClick={() => handleScan('check_in')}
              >
                <LogIn className="h-5 w-5 mr-2" />
                Registrar entrada
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-base"
                onClick={() => handleScan('check_out')}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Registrar salida
              </Button>
            </div>
          )}

          {scanState === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">
                Registrando {attendanceType === 'check_in' ? 'entrada' : 'salida'}…
              </p>
            </div>
          )}

          {scanState === 'success' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-semibold text-center">{message}</p>
              <Button variant="ghost" size="sm" onClick={() => setScanState('idle')}>
                Volver
              </Button>
            </div>
          )}

          {scanState === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm text-center text-red-600 dark:text-red-400">
                {message}
              </p>
              <Button variant="outline" size="sm" onClick={() => setScanState('idle')}>
                Intentar de nuevo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
