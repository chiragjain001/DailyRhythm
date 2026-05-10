"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationPermissionDialog } from '@/components/notification-permission-dialog'
import { NotificationBlockedDialog } from '@/components/notification-blocked-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const notifSupported = typeof window !== 'undefined' && 'Notification' in window

export function NotificationToggle() {
  const { 
    notificationsEnabled, 
    permissionGranted, 
    loading, 
    scheduledNotifications,
    toggleNotifications 
  } = useNotifications()
  
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [showBlockedDialog, setShowBlockedDialog] = useState(false)

  const getTooltipText = () => {
    if (loading) return 'Loading...'
    if (notifSupported && Notification.permission === 'denied') return 'Notifications blocked - Click for help'
    if (!permissionGranted) return 'Click to enable notifications (permission required)'
    if (notificationsEnabled) return `Notifications ON (${scheduledNotifications} scheduled)`
    return 'Notifications OFF - Click to enable'
  }

  const getButtonStyle = () => {
    if (loading) return 'text-gray-400'
    if (notifSupported && Notification.permission === 'denied') return 'text-red-500 hover:text-red-600'
    if (!permissionGranted) return 'text-gray-400 hover:text-orange-500'
    if (notificationsEnabled) return 'text-green-600 hover:text-green-700'
    return 'text-gray-400 hover:text-blue-500'
  }

  const handleClick = async () => {
    if (notifSupported && Notification.permission === 'denied') {
      setShowBlockedDialog(true)
    } else if (!permissionGranted && !notificationsEnabled) {
      setShowPermissionDialog(true)
    } else {
      toggleNotifications()
    }
  }

  const handlePermissionGranted = () => {
    toggleNotifications()
  }

  const handlePermissionDenied = () => {
    // User denied permission, keep notifications disabled
    console.log('User denied notification permission')
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Toggle notifications"
            onClick={handleClick}
            disabled={loading}
            className={`relative ${getButtonStyle()}`}
          >
            {notificationsEnabled && permissionGranted ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
            
            {/* Notification indicator dot */}
            {notificationsEnabled && scheduledNotifications > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
      
      <NotificationPermissionDialog
        isOpen={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
      />
      
      <NotificationBlockedDialog
        isOpen={showBlockedDialog}
        onOpenChange={setShowBlockedDialog}
      />
    </TooltipProvider>
  )
}
