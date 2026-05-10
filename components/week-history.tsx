"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { useMindmateStore, moodToEmoji, type Mood } from "@/store/use-mindmate-store"
import { addDays, format, startOfWeek } from "date-fns"
import TodoAchievement, { type AchievementLevel } from "./todo-achievement"

const moodPalette: Record<Mood, { bg: string; text: string }> = {
  angry: { bg: "bg-red-200", text: "text-red-900" },
  sad: { bg: "bg-orange-200", text: "text-orange-900" },
  meh: { bg: "bg-blue-200", text: "text-blue-900" },
  calm: { bg: "bg-lime-200", text: "text-lime-900" },
  happy: { bg: "bg-lime-300", text: "text-lime-950" },
  cool: { bg: "bg-yellow-200", text: "text-yellow-900" },
}

const order: Mood[] = ["angry", "sad", "meh", "calm", "happy", "cool"]

export function WeekHistory() {
  const { selectedDate, moods = {}, setMood } = useMindmateStore()
  const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 })

  // tasks/habits/wellness are now managed by Supabase hooks, not Zustand
  const totalTasks = 0
  const completedTasks = 0
  const completionPercentage = 0

  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i))
  return (
    <>
      <Card className="rounded-3xl border-none bg-white shadow-sm mb-8">
        <CardHeader className="flex items-center justify-between px-5 pb-2 pt-4 md:px-6">
          <CardTitle className="text-base font-semibold">Week history</CardTitle>
          <Calendar className="h-5 w-5 text-neutral-500" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 px-4 pb-5 md:px-6">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd")
            const mood = moods[key]
            const palette = mood ? moodPalette[mood] : { bg: "bg-neutral-100", text: "text-neutral-600" }
            return (
              <div key={key} className="flex flex-col items-center gap-2">
                <button
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${palette.bg}`}
                  onClick={() => {
                    // cycle to next mood on click
                    const next = order[(order.indexOf(mood ?? "meh") + 1) % order.length]
                    setMood?.(d, next)
                  }}
                  aria-label={`Set mood for ${format(d, "EEE do")}`}
                >
                  <span className={`text-xl ${palette.text}`}>{mood ? moodToEmoji(mood) : "🙂"}</span>
                </button>
                <span className="text-xs text-neutral-600">{format(d, "EEE")}</span>
              </div>
            )
          })}
          {/* Todo Achievement System */}
          {/* Removed TodoAchievement from here as per user feedback */}
          </CardContent>
      </Card>

      
    </>
  )
}
