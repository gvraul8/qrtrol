'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceRecord } from '@/types/attendance.types'

export function useAttendance(employeeId?: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!employeeId) {
      setIsLoading(false)
      return
    }

    const fetchRecords = async () => {
      const { data } = await supabase
        .from('attendance_records')
        .select()
        .eq('employee_id', employeeId)
        .order('timestamp', { ascending: false })
        .limit(30)

      setRecords(data ?? [])
      setIsLoading(false)
    }

    fetchRecords()
  }, [employeeId, supabase])

  return { records, isLoading }
}
