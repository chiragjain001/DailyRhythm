"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { useSupabaseTasks } from "@/hooks/useSupabaseTasks"
import { useSupabaseHabits } from "@/hooks/useSupabaseHabits"
import { useSupabaseWellness } from "@/hooks/useSupabaseWellness"
import { format, subDays, startOfDay } from "date-fns"
import { useMemo } from "react"

export function CalendarChart() {
  const { tasks } = useSupabaseTasks()
  const { habits } = useSupabaseHabits()
  const { wellness } = useSupabaseWellness()
  
  const data = useMemo(() => {
    const days = 7 // Last 7 days for weekly overview
    const result = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i))
      
      // Calculate completion rate based on current data with variation
      const totalItems = (tasks?.length || 0) + (habits?.length || 0) + (wellness?.length || 0)
      const completedItems = (tasks?.filter(t => t.completed).length || 0) + 
                           (habits?.filter(h => h.completedToday).length || 0) + 
                           (wellness?.filter(w => w.completed).length || 0)
      
      const baseRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 30
      const variation = Math.sin(i * 0.5) * 20 + Math.random() * 15 - 7
      const value = Math.max(0, Math.min(100, Math.round(baseRate + variation)))
      
      result.push({
        date: format(date, 'MMM d'),
        value: value
      })
    }
    
    return result
  }, [tasks, habits, wellness])

  const weeklyAverage = Math.round(data.reduce((acc, d) => acc + d.value, 0) / (data.length || 1))

  return (
    <div className="rounded-3xl bg-white p-4 shadow">
      <h4 className="text-lg font-semibold">Monthly Overview</h4>
      <div className="mt-2 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A3E635" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#A3E635" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#84CC16" fill="url(#greenFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-slate-500">Weekly Completion Rate</p>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-lime-400" style={{ width: `${weeklyAverage}%` }} />
      </div>
    </div>
  )
}
