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

interface FormValues {
  full_name: string
  email: string
  role: 'admin' | 'employee'
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  employee?: UserProfile | null
}

export function EmployeeFormModal({ open, onClose, onSaved, employee }: Props) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      full_name: employee?.full_name ?? '',
      email: employee?.email ?? '',
      role: employee?.role ?? 'employee',
    },
  })

  const role = watch('role')

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      if (employee) {
        const res = await fetch(`/api/employees/${employee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: values.full_name, role: values.role }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Error al actualizar')
        toast.success('Empleado actualizado')
      } else {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Error al crear')
        toast.success('Empleado invitado por email')
      }
      reset()
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : employee ? 'Guardar cambios' : 'Invitar empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
