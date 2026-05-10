"use client"

import { useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks'
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits'
import { useSupabaseWellness } from '@/hooks/useSupabaseWellness'

export function NotificationScheduler() {
  const { 
    notificationsEnabled,
    scheduleTaskNotifications,
    scheduleHabitNotifications,
    scheduleWellnessNotifications,
    clearAllNotifications
  } = useNotifications()

  const { tasks } = useSupabaseTasks()
  const { habits } = useSupabaseHabits()
  const { wellness } = useSupabaseWellness()

  // Schedule notifications when data changes or notifications are enabled
  useEffect(() => {
    if (!notificationsEnabled) {
      clearAllNotifications()
      return
    }

    // Clear existing notifications first
    clearAllNotifications()

    // Schedule task notifications
    tasks?.forEach(task => {
      if (task.time && !task.completed) {
        scheduleTaskNotifications(task)
      }
    })

    // Schedule habit notifications
    habits?.forEach(habit => {
      if (habit.time) {
        scheduleHabitNotifications(habit)
      }
    })

    // Schedule wellness notifications
    wellness?.forEach((activity: any) => {
      if (!activity.completed) {
        scheduleWellnessNotifications(activity)
      }
    })

  }, [
    notificationsEnabled,
    tasks,
    habits,
    wellness
  ])

  // This component doesn't render anything
  return null
}
