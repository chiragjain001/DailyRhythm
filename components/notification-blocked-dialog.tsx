"use client"

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BellOff, Settings, Info } from 'lucide-react'

interface NotificationBlockedDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationBlockedDialog({
  isOpen,
  onOpenChange
}: NotificationBlockedDialogProps) {
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') || userAgent.includes('edge')) {
      return {
        browser: 'Chrome/Edge',
        steps: [
          'Click the lock icon (🔒) or info icon (ℹ️) in the address bar',
          'Find "Notifications" in the permissions list',
          'Change it from "Block" to "Allow"',
          'Refresh the page and try again'
        ]
      }
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Click the shield icon or lock icon in the address bar',
          'Click "Connection secure" → "More information"',
          'Go to "Permissions" tab',
          'Find "Receive Notifications" and change to "Allow"',
          'Refresh the page and try again'
        ]
      }
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Go to Safari → Preferences → Websites',
          'Click "Notifications" in the left sidebar',
          'Find this website and change to "Allow"',
          'Refresh the page and try again'
        ]
      }
    } else {
      return {
        browser: 'Your Browser',
        steps: [
          'Look for a lock or info icon in the address bar',
          'Find notification permissions in site settings',
          'Change from "Block" to "Allow"',
          'Refresh the page and try again'
        ]
      }
    }
  }

  const { browser, steps } = getBrowserInstructions()

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <BellOff className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle>Notifications Blocked</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            Your browser has blocked notifications for this site. To enable them, you'll need to reset the permission manually.
          </AlertDialogDescription>
          
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">How to fix this in {browser}:</span>
            </div>
            
            <ol className="space-y-2 text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Why this happened:</strong> Notifications were blocked because permission was denied or ignored multiple times. This is a browser security feature.
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
