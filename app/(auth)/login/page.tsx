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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle invite / recovery links that carry tokens in the URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('type=invite') && !hash.includes('type=recovery')) return

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        subscription.unsubscribe()
        router.replace('/setup-password')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/'
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
          src="/logo.jpg"
          alt="QRtrol"
          width={300}
          height={300}
          className="rounded-2xl object-contain w-24 h-auto sm:w-32 md:w-40"
          priority
        />
        <p className="text-sm text-zinc-500">Control horario por QR dinámico</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6 shadow-sm">
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

      <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-4">
        ¿Sin cuenta? Contacta con tu administrador.
      </p>
    </motion.div>
  )
}
