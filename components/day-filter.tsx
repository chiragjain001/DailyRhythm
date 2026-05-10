"use client"

import { weekLabels } from "@/store/use-mindmate-store"
import { format } from "date-fns"

export function DayFilter() {
  const days = weekLabels().slice(0, -1)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">All</span>
      {days.map((d, i) => (
        <span
          key={i}
          className={`rounded-full px-3 py-1 text-xs ${
            i === 0 ? "bg-lime-100 text-lime-800" : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {i === 0 ? "Today" : format(d.date, "d")}
        </span>
      ))}
    </div>
  )
}
