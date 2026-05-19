'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  logo_url: string | null
  address: string | null
  qr_duration_seconds: number
  created_at: string
}

interface Props { company: Company; userEmail: string }

interface FormValues {
  name: string
  address: string
  qr_duration_seconds: number
}

export function SettingsPageClient({ company, userEmail }: Props) {
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logo_url)
  const [pwSaving, setPwSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('qrtrol_logo_url')
    if (stored) setLogoPreview(stored)
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('El logo no puede superar 2 MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setLogoPreview(dataUrl)
      localStorage.setItem('qrtrol_logo_url', dataUrl)
      toast.success('Logo guardado · se usará en el salvapantallas')
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview(null)
    localStorage.removeItem('qrtrol_logo_url')
    if (fileRef.current) fileRef.current.value = ''
    toast.success('Logo eliminado')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 8) { toast.error('La nueva contraseña debe tener al menos 8 caracteres'); return }
    if (newPw !== confirmPw) { toast.error('Las contraseñas no coinciden'); return }
    setPwSaving(true)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPw })
      if (authError) { toast.error('Contraseña actual incorrecta'); return }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
      if (updateError) throw updateError
      toast.success('Contraseña actualizada')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setPwSaving(false)
    }
  }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: company.name,
      address: company.address ?? '',
      qr_duration_seconds: company.qr_duration_seconds,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/company/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error al guardar')
      toast.success('Ajustes guardados')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Ajustes</h1>
        <p className="text-sm text-zinc-500">Configura tu empresa</p>
      </div>

      {/* Logo */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Logo de empresa</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Se mostrará en el salvapantallas del QR</p>
        </div>

        {logoPreview ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoPreview} alt="Logo empresa" className="h-20 w-20 rounded-xl object-contain border border-gray-200 bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 p-2" />
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Cambiar
              </Button>
              <Button variant="ghost" size="sm" onClick={removeLogo} className="gap-1.5 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
                <X className="h-3.5 w-3.5" /> Eliminar
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 p-8 text-gray-400 dark:text-zinc-500 hover:border-blue-400 dark:hover:border-zinc-500 hover:text-blue-500 dark:hover:text-zinc-400 transition-colors"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Haz clic para subir el logo</span>
            <span className="text-xs">PNG, JPG, SVG · máx. 2 MB</span>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoChange} />
      </div>

      {/* Company settings */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre de la empresa</Label>
            <Input
              id="name"
              {...register('name', { required: 'Nombre requerido' })}
              placeholder="Mi Empresa S.L."
            />
            {errors.name && <p className="text-xs text-red-500 dark:text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Calle Mayor 1, Madrid"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qr_duration_seconds">Duración del QR (segundos)</Label>
            <Input
              id="qr_duration_seconds"
              type="number"
              min={10}
              max={300}
              {...register('qr_duration_seconds', {
                required: 'Requerido',
                min: { value: 10, message: 'Mínimo 10 segundos' },
                max: { value: 300, message: 'Máximo 300 segundos' },
              })}
            />
            {errors.qr_duration_seconds && (
              <p className="text-xs text-red-500 dark:text-red-400">{errors.qr_duration_seconds.message}</p>
            )}
            <p className="text-xs text-zinc-500">
              El QR expirará automáticamente tras este tiempo (20s por defecto).
            </p>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Guardando…' : 'Guardar ajustes'}
          </Button>
        </form>
      </div>
    </div>

      {/* Password change */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Cambiar contraseña</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Necesitas introducir tu contraseña actual para confirmar el cambio</p>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPw">Contraseña actual</Label>
            <Input
              id="currentPw"
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPw">Nueva contraseña</Label>
            <Input
              id="newPw"
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPw">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repite la nueva contraseña"
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={pwSaving} variant="outline" className="w-full">
            {pwSaving ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
