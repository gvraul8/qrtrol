'use client'

import { motion } from 'framer-motion'
import { Clock, TrendingUp, Calendar } from 'lucide-react'

interface Props {
  entriesThisWeek: number
  hoursThisWeek: number
  avgDailyMinutes: number
}

export function WeekStats({ entriesThisWeek, hoursThisWeek, avgDailyMinutes }: Props) {
  const avgH = Math.floor(avgDailyMinutes / 60)
  const avgM = avgDailyMinutes % 60

  const stats = [
    {
      label: 'Fichajes esta semana',
      value: entriesThisWeek,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-blue-400',
    },
    {
      label: 'Horas esta semana',
      value: `${hoursThisWeek}h`,
      icon: <Clock className="h-4 w-4" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Media diaria',
      value: avgDailyMinutes ? `${avgH}h ${avgM}m` : '—',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-3 flex flex-col gap-2"
        >
          <div className={s.color}>{s.icon}</div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{s.value}</p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500 leading-tight">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
