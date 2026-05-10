"use client"

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { addDays, format } from "date-fns"
import { persist, createJSONStorage } from "zustand/middleware"
import wellnessTipsData from "@/lib/wellness-tips.json"
import activitiesData from "@/lib/activities-data.json"
import { safeStorageWithFallback } from "@/lib/safeStorage"
// import { AuthUser } from "@/hooks/useSupabaseAuth" // Commented out as not used

export type Priority = "important" | "today" | "habit"
export type Mood = "angry" | "sad" | "meh" | "calm" | "happy" | "cool"

export interface Task {
  id: string
  title: string
  assignee?: string
  time?: string
  priority: Priority
  progress: number // 0..1
  completed: boolean
  category?: string
  tags?: string[]
  createdAt?: string
}

export interface Habit {
  id: string
  title: string
  note?: string
  time?: string
  streak: number
  completedToday: boolean
  category?: string
  tags?: string[]
}

export interface WellnessItem {
  id: string
  title: string
  completed: boolean
  points?: number
  category?: string
  tags?: string[]
}

export interface ActivityLog {
  id: string
  title: string
  points: number
  direction: "up" | "down"
}

// Using AuthUser from useSupabaseAuth hook instead

interface MindmateState {
  selectedDate: Date
  dailyActivities: DailyActivity[]
  activities: ActivityLog[]
  // mood history keyed by yyyy-MM-dd (stored in localStorage only)
  moods?: Record<string, Mood>
  // actions
  setDate: (d: Date) => void
  nextDay?: () => void
  prevDay?: () => void
  today?: () => void
  setMood?: (date: Date, mood: Mood) => void
  toggleDailyActivity: (id: string) => void
  addActivity?: (a: Omit<ActivityLog, "id">) => void
  // Note: tasks, habits, wellness, and user auth are now handled by Supabase hooks
}

const uid = () => Math.random().toString(36).slice(2, 9)
const keyFor = (d: Date) => format(d, "yyyy-MM-dd")

// Seeded shuffle for deterministic results
function seededShuffle(array: string[], seed: number): string[] {
  const shuffled = [...array]
  let currentSeed = seed
  for (let i = shuffled.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280 // simple LCG
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get 6 deterministic wellness tips for the current day
function getDailyTips(): string[] {
  const today = new Date(new Date().toDateString()) // Normalize to avoid hydration mismatch
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const tips = wellnessTipsData.wellnessTips.map(t => t.tip)
  const shuffled = seededShuffle(tips, seed)
  return shuffled.slice(0, 6)
}

interface DailyActivity {
  id: string
  title: string
  completed: boolean
  points: number
}

// Fetch activities data from API
async function fetchActivitiesData() {
  try {
    const response = await fetch('/api/activities')
    if (!response.ok) throw new Error('Failed to fetch activities')
    return await response.json()
  } catch (error) {
    console.error('Error fetching activities:', error)
    // Fallback to local data
    return activitiesData
  }
}

function getDailyActivitiesSync(data: typeof activitiesData): DailyActivity[] {
  const today = new Date(new Date().toDateString()) // Normalize to avoid hydration mismatch
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const sections = Object.keys(data.Activities) as (keyof typeof data.Activities)[]
  return sections.map(section => {
    const activities = data.Activities[section]
    const shuffled = seededShuffle(activities, seed + sections.indexOf(section))
    const title = shuffled[0]
    let points = 10
    if (title.toLowerCase().includes("language")) points = 30
    else if (title.toLowerCase().includes("breathing")) points = 30
    else if (title.toLowerCase().includes("coding")) points = 20
    return { id: title + seed, title, completed: false, points }
  })
}

export const useMindmateStore = create<MindmateState>()(
  persist(
    immer((set, get) => ({
      selectedDate: new Date(new Date().toDateString()), // Normalize to start of day to avoid hydration mismatch
      dailyActivities: getDailyActivitiesSync(activitiesData),
      activities: [],
      moods: {},
      setDate: (d) => set((s) => void (s.selectedDate = d)),
      nextDay: () => set((s) => void (s.selectedDate = addDays(s.selectedDate, 1))),
      prevDay: () => set((s) => void (s.selectedDate = addDays(s.selectedDate, -1))),
      today: () => set((s) => void (s.selectedDate = new Date(new Date().toDateString()))),
      setMood: (date, mood) =>
        set((s) => {
          if (!s.moods) s.moods = {}
          s.moods[keyFor(date)] = mood
        }),
      toggleDailyActivity: (id) =>
        set((s) => {
          const a = s.dailyActivities.find((x) => x.id === id)
          if (a) a.completed = !a.completed
        }),
      addActivity: (a) =>
        set((s) => {
          s.activities.unshift({ ...a, id: uid() })
        }),
    })),
    {
      name: "mindmate-store",
      storage: createJSONStorage(() => ({
        getItem: (key: string) => safeStorageWithFallback.getItem(key, 'local'),
        setItem: (key: string, value: string) => safeStorageWithFallback.setItem(key, value, 'local'),
        removeItem: (key: string) => safeStorageWithFallback.removeItem(key, 'local'),
      })),
      // Only persist non-user-specific data
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        dailyActivities: state.dailyActivities,
        activities: state.activities,
        moods: state.moods,
      }),
    },
  ),
)

export function weekLabels(base: Date = new Date()) {
  return Array.from({ length: 7 }, (_, i) => addDays(base, i)).map((d) => ({ label: format(d, "d"), date: d }))
}

export function greetingByTime(date: Date = new Date()) {
  const h = date.getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export function moodToEmoji(mood: Mood): string {
  const map: Record<Mood, string> = {
    angry: "😠",
    sad: "😢",
    meh: "😐",
    calm: "😊",
    happy: "😄",
    cool: "😎",
  }
  return map[mood] ?? "😐"
}

// Produces [{ date: ISOString, value: 0..100 }]
// Note: This function now generates mock data since tasks, habits, and wellness
// are handled by Supabase hooks. In a real implementation, you'd pass the actual
// data from the hooks or fetch it from Supabase.
export function buildMonthSeries(
  year: number,
  monthZeroIndexed: number,
  completionData?: { tasks: Task[], habits: Habit[], wellness: WellnessItem[] }
) {
  const d0 = new Date(year, monthZeroIndexed, 1)
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate()
  
  // Base completion from current day status or use mock data
  let base = 20; // Default base value
  
  if (completionData) {
    const totals = completionData.tasks.length + completionData.habits.length + completionData.wellness.length
    const completed =
      completionData.tasks.filter((t) => t.completed).length +
      completionData.habits.filter((h) => h.completedToday).length +
      completionData.wellness.filter((w) => w.completed).length
    base = totals > 0 ? (completed / totals) * 100 : 20
  }

  const series = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(d0.getFullYear(), d0.getMonth(), i + 1)
    // Gentle upward trend shaped by day index
    const trend = (i / Math.max(1, daysInMonth - 1)) * 40
    const noise = ((i * 13) % 7) - 3 // deterministic small wobble
    const value = Math.max(0, Math.min(100, Math.round(base + trend + noise)))
    return { date: date.toISOString(), value }
  })
  return series
}
