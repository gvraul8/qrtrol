'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

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
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_set: true },
      })
      if (error) throw error
      toast.success('Contraseña establecida correctamente')
      window.location.href = '/'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la contraseña')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Icon + heading */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
          <KeyRound className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Bienvenido a QRtrol</h1>
          <p className="text-sm text-zinc-500 mt-1">Establece tu contraseña para continuar</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
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
              autoFocus
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…</>
            ) : (
              'Establecer contraseña'
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}
