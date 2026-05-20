'use client'

import { useState, useEffect } from 'react'
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
import type { TimeEntry } from '@/types/time-entry.types'
import type { UserProfile } from '@/types/auth.types'

interface FormValues {
  user_id: string
  type: 'entry' | 'exit'
  datetime: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (entry: TimeEntry) => void
  entry?: TimeEntry | null
  employees: UserProfile[]
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function EntryFormModal({ open, onClose, onSaved, entry, employees }: Props) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      reset({
        user_id: entry?.user_id ?? '',
        type: entry?.type ?? 'entry',
        datetime: entry
          ? toDatetimeLocal(entry.created_at)
          : toDatetimeLocal(new Date().toISOString()),
      })
    }
  }, [open, entry, reset])

  const type = watch('type')
  const user_id = watch('user_id')

  const onSubmit = async (values: FormValues) => {
    setSaving(true)
    try {
      const created_at = new Date(values.datetime).toISOString()

      if (entry) {
        const res = await fetch(`/api/attendance/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: values.type, created_at }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Error al actualizar')
        onSaved((await res.json()).entry)
        toast.success('Fichaje actualizado')
      } else {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: values.user_id, type: values.type, created_at }),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Error al crear')
        onSaved((await res.json()).entry)
        toast.success('Fichaje creado')
      }
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
          <DialogTitle>{entry ? 'Editar fichaje' : 'Añadir fichaje'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {!entry && (
            <div className="space-y-1.5">
              <Label>Empleado</Label>
              <Select value={user_id} onValueChange={(v) => setValue('user_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado…" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setValue('type', v as 'entry' | 'exit')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrada</SelectItem>
                <SelectItem value="exit">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="datetime">Fecha y hora</Label>
            <Input
              id="datetime"
              type="datetime-local"
              {...register('datetime', { required: true })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : entry ? 'Guardar cambios' : 'Añadir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
