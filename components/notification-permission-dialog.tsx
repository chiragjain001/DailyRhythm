"use client"

import React, { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Bell, Clock, Target, Heart } from 'lucide-react'

interface NotificationPermissionDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPermissionGranted: () => void
  onPermissionDenied: () => void
}

export function NotificationPermissionDialog({
  isOpen,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied
}: NotificationPermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false)

  const handleEnableNotifications = async () => {
    setIsRequesting(true)
    
    try {
      // iOS Safari doesn't support Web Notifications at all
      if (typeof window === 'undefined' || !('Notification' in window)) {
        onPermissionDenied()
        onOpenChange(false)
        return
      }

      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        onPermissionGranted()
        onOpenChange(false)
      } else {
        onPermissionDenied()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      onPermissionDenied()
      onOpenChange(false)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleCancel = () => {
    onPermissionDenied()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <AlertDialogTitle>Enable Notifications</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Stay on top of your goals with smart reminders! We'll send you notifications for:
          </AlertDialogDescription>
          
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                <strong>Tasks:</strong> 5 & 2 minutes before important tasks, 2 minutes before daily tasks
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                <strong>Habits:</strong> 5 minutes before scheduled time + gentle end-of-day reminders
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Heart className="h-4 w-4 text-purple-600" />
              <span className="text-sm">
                <strong>Wellness:</strong> Regular check-ins throughout the day
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            You can turn notifications on/off anytime using the bell icon in the top bar.
          </p>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleEnableNotifications}
            disabled={isRequesting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRequesting ? 'Requesting...' : 'Enable Notifications'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
