"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { safeStorageWithFallback } from '@/lib/safeStorage'
import { useAuthRateLimit } from '@/hooks/useRateLimit'

// ── Safari / iOS guard ─────────────────────────────────────────────
// The Web Notifications API does not exist on iOS Safari at all.
// Accessing `Notification` throws a ReferenceError and crashes the
// entire React tree. This helper returns a safe, no-op shim.
function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export interface NotificationData {
  title: string
  body: string
  type: 'task' | 'habit' | 'wellness'
  id: string
  scheduledTime: Date
  priority?: 'high' | 'medium' | 'low'
}

export interface ScheduledNotification {
  id: string
  timeoutId: NodeJS.Timeout
  data: NotificationData
}

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [scheduledCount, setScheduledCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const scheduledNotificationsRef = useRef<ScheduledNotification[]>([])
  const { isAllowed: isAuthAllowed } = useAuthRateLimit()

  // Check notification permission and load user preference
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check browser notification permission without requesting
        const permission = getNotificationPermission()
        setPermissionGranted(permission === 'granted')

        // If notifications aren't supported (iOS), skip DB check
        if (!isNotificationSupported()) {
          setLoading(false)
          return
        }

        // Load user's notification preference from database
        if (!isAuthAllowed()) {
          console.warn('Rate limit exceeded for auth session check')
          setLoading(false)
          return
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('notifications_enabled')
            .eq('id', session.user.id)
            .single()
          
          if (profile && profile.notifications_enabled !== undefined) {
            setNotificationsEnabled(profile.notifications_enabled && permission === 'granted')
          } else {
            // Column doesn't exist yet, use localStorage as fallback
            const localPref = safeStorageWithFallback.getItem('notifications_enabled')
            const defaultEnabled = localPref !== null ? JSON.parse(localPref) : true
            setNotificationsEnabled(defaultEnabled && permission === 'granted')
          }
        }
      } catch (error) {
        console.error('Error initializing notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeNotifications()
  }, [])

  // Toggle notifications and save to database
  const toggleNotifications = useCallback(async () => {
    try {
      if (!isNotificationSupported()) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      // If notifications are being enabled, check permission first
      if (!notificationsEnabled && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setPermissionGranted(false)
          return
        }
        setPermissionGranted(true)
      }

      const newState = !notificationsEnabled
      setNotificationsEnabled(newState)

      // Save to database (only if column exists)
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ notifications_enabled: newState })
          .eq('id', session.user.id)
        
        if (error) {
          console.error('Database error:', error)
          // Save to localStorage as fallback
          safeStorageWithFallback.setItem('notifications_enabled', JSON.stringify(newState))
        }
      } catch (dbError) {
        console.warn('Failed to save notification preference to database, using localStorage:', dbError)
        // Save to localStorage as fallback
        safeStorageWithFallback.setItem('notifications_enabled', JSON.stringify(newState))
      }

      // Clear all scheduled notifications if disabling
      if (!newState) {
        clearAllNotifications()
      }

    } catch (error) {
      console.error('Error toggling notifications:', error)
    }
  }, [notificationsEnabled])

  // Send immediate notification
  const sendNotification = useCallback((data: NotificationData) => {
    if (!isNotificationSupported()) return
    if (!notificationsEnabled || !permissionGranted) return

    const notification = new Notification(data.title, {
      body: data.body,
      icon: '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: `${data.type}-${data.id}`,
      requireInteraction: data.priority === 'high',
      silent: false,
    })

    // Handle notification click
    notification.onclick = () => {
      window.focus()
      // Navigate to appropriate page based on type
      switch (data.type) {
        case 'task':
          window.location.href = '/dashboard'
          break
        case 'habit':
          window.location.href = '/dashboard'
          break
        case 'wellness':
          window.location.href = '/dashboard'
          break
      }
      notification.close()
    }

    // Auto-close after 10 seconds for non-high priority
    if (data.priority !== 'high') {
      setTimeout(() => notification.close(), 10000)
    }

    return notification
  }, [notificationsEnabled, permissionGranted])

  // Schedule a notification
  const scheduleNotification = useCallback((data: NotificationData) => {
    if (!isNotificationSupported()) return
    if (!notificationsEnabled || !permissionGranted) return

    const now = new Date()
    const delay = data.scheduledTime.getTime() - now.getTime()

    if (delay <= 0) {
      // Send immediately if time has passed
      sendNotification(data)
      return
    }

    const timeoutId = setTimeout(() => {
      sendNotification(data)
      // Remove from scheduled notifications
      scheduledNotificationsRef.current = scheduledNotificationsRef.current.filter(
        notif => notif.id !== data.id
      )
      setScheduledCount(scheduledNotificationsRef.current.length)
    }, delay)

    const scheduledNotif: ScheduledNotification = {
      id: data.id,
      timeoutId,
      data
    }

    scheduledNotificationsRef.current.push(scheduledNotif)
    setScheduledCount(scheduledNotificationsRef.current.length)
    return scheduledNotif
  }, [notificationsEnabled, permissionGranted, sendNotification])

  // Cancel a scheduled notification
  const cancelNotification = useCallback((id: string) => {
    const notif = scheduledNotificationsRef.current.find(n => n.id === id)
    if (notif) {
      clearTimeout(notif.timeoutId)
    }
    scheduledNotificationsRef.current = scheduledNotificationsRef.current.filter(n => n.id !== id)
    setScheduledCount(scheduledNotificationsRef.current.length)
  }, [])

  // Clear all scheduled notifications
  const clearAllNotifications = useCallback(() => {
    scheduledNotificationsRef.current.forEach(notif => {
      clearTimeout(notif.timeoutId)
    })
    scheduledNotificationsRef.current = []
    setScheduledCount(0)
  }, [])

  // Schedule task notifications
  const scheduleTaskNotifications = useCallback((task: any) => {
    if (!notificationsEnabled || !task.time) return

    const taskTime = new Date()
    const [hours, minutes] = task.time.split(':').map(Number)
    taskTime.setHours(hours, minutes, 0, 0)

    // If task is for a different date, adjust accordingly
    if (task.date && task.date !== new Date().toDateString()) {
      const taskDate = new Date(task.date)
      taskTime.setFullYear(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
    }

    const notifications: NotificationData[] = []

    // Schedule based on priority
    if (task.priority === 'important') {
      // 5 minutes before
      const fiveMinBefore = new Date(taskTime.getTime() - 5 * 60 * 1000)
      notifications.push({
        id: `task-${task.id}-5min`,
        title: `Task Reminder - 5 minutes`,
        body: `"${task.title}" is scheduled in 5 minutes`,
        type: 'task',
        scheduledTime: fiveMinBefore,
        priority: 'high'
      })

      // 2 minutes before
      const twoMinBefore = new Date(taskTime.getTime() - 2 * 60 * 1000)
      notifications.push({
        id: `task-${task.id}-2min`,
        title: `Task Reminder - 2 minutes`,
        body: `"${task.title}" is starting in 2 minutes`,
        type: 'task',
        scheduledTime: twoMinBefore,
        priority: 'high'
      })
    } else {
      // 2 minutes before for daily tasks
      const twoMinBefore = new Date(taskTime.getTime() - 2 * 60 * 1000)
      notifications.push({
        id: `task-${task.id}-2min`,
        title: `Task Reminder`,
        body: `"${task.title}" is starting in 2 minutes`,
        type: 'task',
        scheduledTime: twoMinBefore,
        priority: 'medium'
      })
    }

    notifications.forEach(notif => scheduleNotification(notif))
  }, [notificationsEnabled, scheduleNotification])

  // Schedule habit notifications
  const scheduleHabitNotifications = useCallback((habit: any) => {
    if (!notificationsEnabled || !habit.time) return

    const habitTime = new Date()
    const [hours, minutes] = habit.time.split(':').map(Number)
    habitTime.setHours(hours, minutes, 0, 0)

    // 5 minutes before habit time
    const fiveMinBefore = new Date(habitTime.getTime() - 5 * 60 * 1000)
    scheduleNotification({
      id: `habit-${habit.id}-5min`,
      title: `Habit Reminder`,
      body: `Time for "${habit.title}" in 5 minutes`,
      type: 'habit',
      scheduledTime: fiveMinBefore,
      priority: 'medium'
    })

    // End of day reminders if habit not completed (3 times)
    const endOfDayTimes = [
      new Date().setHours(18, 0, 0, 0), // 6 PM
      new Date().setHours(20, 0, 0, 0), // 8 PM
      new Date().setHours(22, 0, 0, 0), // 10 PM
    ]

    endOfDayTimes.forEach((time, index) => {
      scheduleNotification({
        id: `habit-${habit.id}-eod-${index}`,
        title: `Don't forget your habit!`,
        body: `You haven't completed "${habit.title}" today`,
        type: 'habit',
        scheduledTime: new Date(time),
        priority: 'low'
      })
    })
  }, [notificationsEnabled, scheduleNotification])

  // Schedule wellness notifications
  const scheduleWellnessNotifications = useCallback((activity: any) => {
    if (!notificationsEnabled) return

    // Default wellness reminder times
    const reminderTimes = [
      new Date().setHours(9, 0, 0, 0),  // 9 AM
      new Date().setHours(14, 0, 0, 0), // 2 PM
      new Date().setHours(19, 0, 0, 0), // 7 PM
    ]

    reminderTimes.forEach((time, index) => {
      scheduleNotification({
        id: `wellness-${activity.id}-${index}`,
        title: `Wellness Check-in`,
        body: `Time for your wellness activity: ${activity.title}`,
        type: 'wellness',
        scheduledTime: new Date(time),
        priority: 'low'
      })
    })
  }, [notificationsEnabled, scheduleNotification])

  return {
    notificationsEnabled,
    permissionGranted,
    loading,
    scheduledNotifications: scheduledCount,
    toggleNotifications,
    sendNotification,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    scheduleTaskNotifications,
    scheduleHabitNotifications,
    scheduleWellnessNotifications,
  }
}
