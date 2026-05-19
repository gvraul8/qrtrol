'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { QrCode, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciales incorrectas')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
          <QrCode className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">QRtrol</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Control horario por QR dinámico</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 mt-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-600 mt-4">
        ¿Sin cuenta? Contacta con tu administrador.
      </p>
    </motion.div>
  )
}
