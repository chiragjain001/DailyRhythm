"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import { useMindmateStore } from "@/store/use-mindmate-store"

export function Activities() {
  const { dailyActivities } = useMindmateStore()

  return (
    <Card className="rounded-3xl border-none bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-5 pb-1 pt-4 md:px-6">
        <CardTitle className="text-base font-semibold">Today's Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 md:px-6">
        {dailyActivities.map((a) => {
          return (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-3"
            >
              <span className="text-sm text-neutral-800">
                {a.title}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-700">
                {(a as any).points} <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
