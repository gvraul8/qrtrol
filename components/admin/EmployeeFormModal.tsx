'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserProfile } from '@/types/auth.types'

type CreationMode = 'invite' | 'direct'

interface FormValues {
  full_name: string
  email: string
  role: 'admin' | 'employee'
  password: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  employee?: UserProfile | null
}

export function EmployeeFormModal({ open, onClose, onSaved, employee }: Props) {
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<CreationMode>('invite')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      full_name: employee?.full_name ?? '',
      email: employee?.email ?? '',
      role: employee?.role ?? 'employee',
      password: '',
    },
  })

  const role = watch('role')

  const handleClose = () => {
    reset()
    setMode('invite')
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      if (employee) {
        const res = await fetch(`/api/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: values.full_name, role: values.role }),
        })
        if (!res.ok) {
          const text = await res.text()
          const json = text ? JSON.parse(text) : {}
          throw new Error(json.error ?? 'Error al actualizar')
        }
        toast.success('Empleado actualizado')
      } else {
        const body: Record<string, string> = {
          full_name: values.full_name,
          email: values.email,
          role: values.role,
          mode,
        }
        if (mode === 'direct') body.password = values.password

        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          const json = text ? JSON.parse(text) : {}
          throw new Error(json.error ?? 'Error al crear')
        }
        toast.success(mode === 'invite' ? 'Invitación enviada por email' : 'Usuario creado correctamente')
      }
      reset()
      setMode('invite')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Nombre requerido' })}
              placeholder="Ana García"
            />
            {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
          </div>

          {!employee && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email requerido' })}
                  placeholder="ana@empresa.com"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Método de acceso</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('invite')}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors text-left ${
                      mode === 'invite'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">Enviar invitación</div>
                    <div className="text-xs opacity-70 mt-0.5">El empleado establece su contraseña</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('direct')}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors text-left ${
                      mode === 'direct'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">Crear con contraseña</div>
                    <div className="text-xs opacity-70 mt-0.5">Tú asignas la contraseña inicial</div>
                  </button>
                </div>
              </div>

              {mode === 'direct' && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña temporal</Label>
                  <Input
                    id="password"
                    type="text"
                    {...register('password', {
                      required: mode === 'direct' ? 'Contraseña requerida' : false,
                      minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                    })}
                    placeholder="Ej: 1234ab"
                    autoComplete="off"
                  />
                  {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    El empleado podrá cambiarla desde su perfil.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setValue('role', v as 'admin' | 'employee')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Guardando…'
                : employee
                  ? 'Guardar cambios'
                  : mode === 'invite'
                    ? 'Enviar invitación'
                    : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
