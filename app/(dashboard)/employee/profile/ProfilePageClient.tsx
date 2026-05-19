'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import type { UserProfile } from '@/types/auth.types'

interface Props { profile: UserProfile }

interface FormValues { full_name: string }
interface PwdValues { password: string; confirm: string }

export function ProfilePageClient({ profile }: Props) {
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { full_name: profile.full_name },
  })

  const { register: regPwd, handleSubmit: handlePwd, watch, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PwdValues>()

  const onSaveName = async (values: FormValues) => {
    setSaving(true)
    const res = await fetch(`/api/employees/${profile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: values.full_name }),
    })
    if (res.ok) toast.success('Nombre actualizado')
    else toast.error('Error al actualizar')
    setSaving(false)
  }

  const onChangePwd = async (values: PwdValues) => {
    setChangingPwd(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) toast.error(error.message)
    else { toast.success('Contraseña actualizada'); resetPwd() }
    setChangingPwd(false)
  }

  const pwd = watch('password')

  return (
    <div className="space-y-6 animate-fade-in max-w-md">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Mi perfil</h1>
        <p className="text-sm text-zinc-500">Gestiona tus datos personales</p>
      </div>

      {/* Avatar + basic info */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
        <Avatar className="h-14 w-14">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
          <AvatarFallback className="text-lg">{getInitials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{profile.full_name}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile.email}</p>
          <Badge className="mt-1.5" variant={profile.role === 'admin' ? 'blue' : 'default'}>
            {profile.role === 'admin' ? 'Administrador' : 'Empleado'}
          </Badge>
        </div>
      </div>

      {/* Edit name */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Información personal</h2>
        <form onSubmit={handleSubmit(onSaveName)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" {...register('full_name', { required: 'Requerido' })} />
            {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar nombre'}
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Cambiar contraseña</h2>
        <form onSubmit={handlePwd(onChangePwd)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input
              id="password"
              type="password"
              {...regPwd('password', { required: 'Requerido', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
            />
            {pwdErrors.password && <p className="text-xs text-red-400">{pwdErrors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type="password"
              {...regPwd('confirm', { validate: (v) => v === pwd || 'Las contraseñas no coinciden' })}
            />
            {pwdErrors.confirm && <p className="text-xs text-red-400">{pwdErrors.confirm.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={changingPwd}>
            {changingPwd ? 'Actualizando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
