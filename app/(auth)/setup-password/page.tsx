'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SetupPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Wait for Supabase to process the hash-based token before showing the form
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setReady(true)
        subscription.unsubscribe()
      }
    })
    // Also check if a session already exists (e.g. token was already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
        subscription.unsubscribe()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Contraseña establecida correctamente')
    window.location.href = '/'
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
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
        <Image
          src="/logo.png"
          alt="QRtrol"
          width={300}
          height={300}
          className="rounded-2xl object-contain w-36 h-auto sm:w-44 md:w-56"
          priority
        />
        <p className="text-sm text-zinc-500">Control horario por QR dinámico</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
          Crear contraseña
        </h1>
        <p className="text-sm text-zinc-500 mb-5">
          Establece una contraseña para acceder a tu cuenta.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar contraseña'
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}
