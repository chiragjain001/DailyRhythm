"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"
import { useWeeklyCompletionData } from "@/hooks/useWeeklyCompletionData"
import type { WeeklyDayData } from "@/hooks/useWeeklyCompletionData"

/* ─── tiny colour scale ──────────────────────────────────────────── */
function barGradient(pct: number, isToday: boolean, isFuture: boolean) {
  if (isFuture)  return 'linear-gradient(to top, #d1d5db, #e5e7eb)'          // muted grey
  if (isToday)   return 'linear-gradient(to top, #f97316, #facc15)'           // orange→yellow
  if (pct >= 80) return 'linear-gradient(to top, #22c55e, #86efac)'           // green
  if (pct >= 60) return 'linear-gradient(to top, #3b82f6, #93c5fd)'           // blue
  if (pct >= 40) return 'linear-gradient(to top, #a855f7, #d8b4fe)'           // purple
  if (pct >= 20) return 'linear-gradient(to top, #f43f5e, #fda4af)'           // pink-red
  return          'linear-gradient(to top, #6b7280, #9ca3af)'                  // low – slate
}

function barGlow(pct: number, isToday: boolean, isFuture: boolean) {
  if (isFuture) return 'none'
  if (isToday)  return '0 0 16px 2px rgba(251,146,60,.55)'
  if (pct >= 80) return '0 0 10px 1px rgba(34,197,94,.35)'
  if (pct >= 60) return '0 0 10px 1px rgba(59,130,246,.35)'
  return 'none'
}

/* ─── badge colour by level ─────────────────────────────────────── */
function badge(pct: number) {
  if (pct >= 80) return { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-700' }
  if (pct >= 60) return { label: 'Good',      cls: 'bg-blue-100 text-blue-700'       }
  if (pct >= 40) return { label: 'Fair',      cls: 'bg-purple-100 text-purple-700'   }
  if (pct >= 20) return { label: 'Low',       cls: 'bg-rose-100 text-rose-600'       }
  return               { label: 'None',       cls: 'bg-gray-100 text-gray-500'       }
}

function ChartSkeleton() {
  const heights = [45, 65, 50, 75, 55, 80, 40];
  return (
    <Card className="rounded-3xl p-6 bg-white border-gray-100 shadow-sm">
      <div className="h-4 w-44 bg-gray-200 rounded-full mb-6 animate-pulse" />
      <div className="flex items-end gap-2 h-44">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full bg-gray-100 animate-pulse"
            style={{ height: `${heights[i]}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex justify-center">
            <div className="h-3 w-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  )
}

/* ─── Tooltip ────────────────────────────────────────────────────── */
interface TooltipProps {
  data: WeeklyDayData
  visible: boolean
  x: number
  y: number
}

function Tooltip({ data, visible, x, y }: TooltipProps) {
  if (!visible) return null
  const { label, cls } = badge(data.completionPercentage)

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x, top: y, transform: 'translate(-50%, -110%)' }}
    >
      <div className="bg-gray-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs min-w-[160px] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{data.dayName}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
        </div>
        <div className="text-2xl font-bold text-white mb-2">{data.completionPercentage}%</div>
        <div className="space-y-1 text-gray-300">
          {data.totalTasks > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span>Tasks: <b className="text-white">{data.completedTasks}/{data.totalTasks}</b></span>
            </div>
          )}
          {data.totalHabits > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <span>Habits: <b className="text-white">{data.completedHabits}/{data.totalHabits}</b></span>
            </div>
          )}
          {data.totalWellness > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
              <span>Wellness: <b className="text-white">{data.completedWellness}/{data.totalWellness}</b></span>
            </div>
          )}
          {data.isFutureDay && (
            <div className="text-gray-500 italic mt-1">Not started yet</div>
          )}
        </div>
        {/* Arrow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
          style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(17,24,39,.95)' }} />
      </div>
    </div>
  )
}

/* ─── Main chart ─────────────────────────────────────────────────── */
export function WeeklyCompletionChart() {
  const { weekData, loading, error } = useWeeklyCompletionData()
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: WeeklyDayData | null }>({
    visible: false, x: 0, y: 0, data: null
  })
  const [mounted, setMounted] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const showTip = (e: React.MouseEvent, day: WeeklyDayData) => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    const r = e.currentTarget.getBoundingClientRect()
    setTooltip({ visible: true, x: r.left + r.width / 2, y: r.top, data: day })
  }

  const hideTip = () => {
    hideTimer.current = setTimeout(() =>
      setTooltip(prev => ({ ...prev, visible: false })), 100)
  }

  if (loading) return <ChartSkeleton />

  // Compute weekly summary stats
  const activeDays   = weekData.filter(d => !d.isFutureDay)
  const avgPct       = activeDays.length
    ? Math.round(activeDays.reduce((s, d) => s + d.completionPercentage, 0) / activeDays.length)
    : 0
  const bestDay      = activeDays.reduce<WeeklyDayData | null>((best, d) =>
    !best || d.completionPercentage > best.completionPercentage ? d : best, null)
  const todayData    = weekData.find(d => d.isCurrentDay)
  const todayPct     = todayData?.completionPercentage ?? 0
  const { label: todayLabel, cls: todayCls } = badge(todayPct)

  return (
    <>
      <Card className="rounded-3xl p-5 bg-white border-gray-100 shadow-sm select-none">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Weekly Completion</h3>
            <p className="text-xs text-gray-400 mt-0.5">Mon – Sun · real-time</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-2xl font-bold text-gray-900">{avgPct}%</span>
            </div>
            <p className="text-[10px] text-gray-400">week avg</p>
          </div>
        </div>

        {/* ── Summary Pills ──────────────────────────── */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {/* Today */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${todayCls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            Today: {todayPct}% · {todayLabel}
          </div>
          {/* Best day */}
          {bestDay && bestDay.completionPercentage > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <span>🏆</span>
              Best: {bestDay.dayShort} {bestDay.completionPercentage}%
            </div>
          )}
          {/* Error notice */}
          {error && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* ── Bar Chart ──────────────────────────────── */}
        <div className="relative flex pl-6 gap-1.5 sm:gap-2 items-end" style={{ height: 160 }}>

          {/* Y-axis lines */}
          {[100, 75, 50, 25].map(pct => (
            <div
              key={pct}
              className="absolute left-6 right-0 border-t border-gray-100 flex items-center"
              style={{ bottom: `${pct}%` }}
            >
              <span className="absolute -left-6 text-[9px] text-gray-300 w-5 text-right select-none -mt-px">
                {pct}
              </span>
            </div>
          ))}
          
          {/* X-axis baseline */}
          <div className="absolute left-6 right-0 bottom-0 border-b border-gray-200" />

          {/* Bars */}
          {weekData.map((day, i) => {
            const heightPct = day.isFutureDay
              ? 8
              : Math.max(day.completionPercentage, day.completionPercentage > 0 ? 4 : 0)

            return (
              <div
                key={day.date.toISOString()}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <button
                  className="w-full relative rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  style={{
                    height: `${heightPct}%`,
                    minHeight: 6,
                    background: barGradient(day.completionPercentage, day.isCurrentDay, day.isFutureDay),
                    boxShadow: barGlow(day.completionPercentage, day.isCurrentDay, day.isFutureDay),
                    transform: mounted ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'bottom',
                    transition: `transform 0.7s cubic-bezier(.22,1,.36,1) ${i * 60}ms, height 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.3s`,
                    opacity: mounted ? 1 : 0,
                  }}
                  onMouseEnter={e => showTip(e, day)}
                  onMouseLeave={hideTip}
                  onFocus={e => showTip(e as any, day)}
                  onBlur={hideTip}
                  aria-label={`${day.dayName}: ${day.completionPercentage}% complete`}
                >
                  {/* shimmer on current day bar */}
                  {day.isCurrentDay && (
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(90deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%)',
                          animation: 'shimmer 2.5s ease-in-out infinite',
                        }}
                      />
                    </div>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── Day Labels ─────────────────────────────── */}
        <div className="flex pl-6 gap-1.5 sm:gap-2 mt-2">
          {weekData.map(day => (
            <div key={`lbl-${day.date.toISOString()}`} className="flex-1 text-center">
              <div
                className={`text-[10px] sm:text-xs font-medium transition-colors ${
                  day.isCurrentDay
                    ? 'text-orange-500 font-bold'
                    : day.isFutureDay
                    ? 'text-gray-300'
                    : 'text-gray-500'
                }`}
              >
                {day.dayShort}
              </div>
              {day.isCurrentDay && (
                <div className="w-1 h-1 rounded-full bg-orange-400 mx-auto mt-0.5" />
              )}
            </div>
          ))}
        </div>

        {/* ── Legend ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[10px] text-gray-400">
          {[
            { color: 'bg-gray-300', label: 'No data' },
            { color: 'bg-rose-400',   label: '<40%'   },
            { color: 'bg-purple-400', label: '40–60%' },
            { color: 'bg-blue-400',   label: '60–80%' },
            { color: 'bg-green-400',  label: '80–100%' },
            { color: 'bg-orange-400', label: 'Today'   },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* shimmer keyframe */}
      <style jsx global>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
      `}</style>

      {/* Tooltip portal-like (fixed position) */}
      {tooltip.data && (
        <Tooltip
          data={tooltip.data}
          visible={tooltip.visible}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </>
  )
}
