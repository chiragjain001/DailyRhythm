"use client"

import { Card } from "@/components/ui/card"
import { HabitsCard } from "./habits-card"
import { WellnessChecklist } from "./wellness-checklist"
import { Activities } from "./activities"

export function Panel2() {
  // All data is now handled by individual components via Supabase hooks

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-4 p-2 overflow-hidden">
      {/* Habits Section */}
      <Card className="min-h-[250px] max-h-[350px] overflow-y-auto rounded-2xl shadow-md bg-white p-0 text-base md:text-lg lg:text-xl">
        <HabitsCard />
      </Card>

      {/* Wellness Section */}
      <Card className="min-h-[230px] max-h-[350px] overflow-y-auto rounded-2xl shadow-md bg-white p-0 text-base md:text-lg lg:text-xl">
        <WellnessChecklist />
      </Card>

      {/* Activities Section */}
      <Card className="flex-1 overflow-y-auto rounded-2xl shadow-md bg-white p-0 text-base md:text-lg lg:text-xl">
        <Activities />
      </Card>
    </div>
  )
}
