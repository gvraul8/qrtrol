'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DayData {
  day: string
  hours: number
}

interface Props {
  data: DayData[]
}

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload?.length) {
    return (
      <div
        className={
          isDark
            ? 'rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs shadow-xl'
            : 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-xl'
        }
      >
        <p className={`font-medium mb-1 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{label}</p>
        <p className={isDark ? 'text-blue-400' : 'text-blue-600'}>{payload[0].value}h trabajadas</p>
      </div>
    )
  }
  return null
}

export function WeeklyHoursChart({ data }: Props) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === 'dark'
  const gridColor   = isDark ? '#27272a' : '#e5e7eb'
  const tickColor   = isDark ? '#71717a' : '#9ca3af'
  const cursorColor = isDark ? 'rgba(63,63,70,0.3)' : 'rgba(0,0,0,0.05)'
  const barColor    = isDark ? '#3b82f6' : '#2563eb'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: tickColor, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: cursorColor }} />
        <Bar dataKey="hours" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
