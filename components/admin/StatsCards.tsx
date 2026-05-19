'use client'

import { motion } from 'framer-motion'
import { Users, LogIn, CheckCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stat {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: string
}

interface Props {
  totalEmployees: number
  entriesTotal: number
  activeNow: number
  avgMinutesToday: number
}

export function StatsCards({ totalEmployees, entriesTotal, activeNow, avgMinutesToday }: Props) {
  const stats: Stat[] = [
    {
      label: 'Empleados',
      value: totalEmployees,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-400',
      sub: 'en plantilla',
    },
    {
      label: 'Fichajes hoy',
      value: entriesTotal,
      icon: <LogIn className="h-5 w-5" />,
      color: 'text-emerald-400',
      sub: 'entradas + salidas',
    },
    {
      label: 'Trabajando ahora',
      value: activeNow,
      icon: <CheckCheck className="h-5 w-5" />,
      color: 'text-amber-400',
      sub: 'en activo',
    },
    {
      label: 'Media hoy',
      value: avgMinutesToday ? `${Math.round(avgMinutesToday / 60)}h ${avgMinutesToday % 60}m` : '—',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-violet-400',
      sub: 'por empleado',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-4 flex flex-col gap-3"
        >
          <div className={cn('w-fit rounded-lg p-2 bg-gray-100 dark:bg-zinc-800/60', s.color)}>{s.icon}</div>
          <div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.sub}</p>
          </div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
