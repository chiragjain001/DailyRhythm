"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Clock, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Priority } from "@/store/use-mindmate-store"
import { PrioritySelector } from "./priority-selector"
import { useLongPress } from "@/hooks/use-long-press"

interface TaskInputCardProps {
  onSubmit: (task: {
    title: string
    priority: Priority
    time?: string
    assignee?: string
  }) => void
  onCancel?: () => void
  className?: string
  task?: {
    title: string
    priority: Priority | string
    time?: string
    assignee?: string
  }
}

export function TaskInputCard({ onSubmit, onCancel, className, task }: TaskInputCardProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [selectedPriority, setSelectedPriority] = useState<Priority>((task?.priority as Priority) || "today")
  const [assignee, setAssignee] = useState(task?.assignee || "")
  const [time, setTime] = useState(task?.time || "")
  const [showTimePicker, setShowTimePicker] = useState(false)
  // Temporary states for picker
  const [tempHour, setTempHour] = useState(7)
  const [tempMinute, setTempMinute] = useState(0)
  const [tempAmPm, setTempAmPm] = useState<"AM" | "PM">("AM")
  const [mounted, setMounted] = useState(false)

  // Long-press handlers with 300ms delay for smooth continuous change
  const hourIncLongPress = useLongPress(() => {
    let newHour = tempHour === 12 ? 1 : tempHour + 1
    setTempHour(newHour)
  }, 300)
  const hourDecLongPress = useLongPress(() => {
    let newHour = tempHour === 1 ? 12 : tempHour - 1
    setTempHour(newHour)
  }, 300)
  const minuteIncLongPress = useLongPress(() => {
    let newMinute = (tempMinute + 1) % 60
    setTempMinute(newMinute)
  }, 300)
  const minuteDecLongPress = useLongPress(() => {
    let newMinute = tempMinute === 0 ? 59 : tempMinute - 1
    setTempMinute(newMinute)
  }, 300)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    onSubmit({
      title: trimmedTitle,
      priority: selectedPriority,
      assignee: assignee.trim() || undefined,
      time: time || undefined,
    })

    // Reset form
    setTitle("")
    setSelectedPriority("today")
    setAssignee("")
    setTime("")
  }

  // Initialize temp values when time picker opens
  useEffect(() => {
    if (showTimePicker && time) {
      const [timePart, ampm] = time.split(' ')
      const [hourStr, minuteStr] = timePart.split(':')
      const hour = parseInt(hourStr)
      const minute = parseInt(minuteStr)
      setTempHour(hour)
      setTempMinute(minute)
      setTempAmPm(ampm as "AM" | "PM")
    } else if (showTimePicker && !time) {
      // Default values if no time is set
      setTempHour(7)
      setTempMinute(0)
      setTempAmPm("AM")
    }
  }, [showTimePicker, time])

  // Update time immediately when picker values change
  useEffect(() => {
    if (showTimePicker) {
      const newTime = `${tempHour}:${String(tempMinute).padStart(2, "0")} ${tempAmPm}`
      setTime(newTime)
    }
  }, [tempHour, tempMinute, tempAmPm, showTimePicker])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showTimePicker) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (e.shiftKey) {
            // Shift+Up: Increment hour
            setTempHour(prev => prev === 12 ? 1 : prev + 1)
          } else {
            // Up: Increment minute
            setTempMinute(prev => (prev + 1) % 60)
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (e.shiftKey) {
            // Shift+Down: Decrement hour
            setTempHour(prev => prev === 1 ? 12 : prev - 1)
          } else {
            // Down: Decrement minute
            setTempMinute(prev => prev === 0 ? 59 : prev - 1)
          }
          break
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault()
          // Toggle AM/PM
          setTempAmPm(prev => prev === 'AM' ? 'PM' : 'AM')
          break
        case 'Enter':
          e.preventDefault()
          setShowTimePicker(false)
          break
        case 'Escape':
          e.preventDefault()
          setShowTimePicker(false)
          break
      }
    }

    if (showTimePicker) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showTimePicker])



  return (
    <Card className={cn("rounded-2xl shadow-sm border-neutral-200", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Task Title Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Plus className="h-4 w-4 text-neutral-400" />
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
                if (e.key === "Escape") onCancel?.()
              }}
              placeholder="Enter task title..."
              className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Priority Selector */}
        <div className="space-y-2">
          <PrioritySelector
            selectedPriority={selectedPriority}
            onPrioritySelect={setSelectedPriority}
          />
        </div>

        {/* Assignee Input */}
        <div className="space-y-2">
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee (optional)..."
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400"
          />
        </div>

        {/* Time Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left hover:bg-neutral-100 transition-colors"
          >
            <Clock className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">
                  {time || "Set time (optional)"}
            </span>
          </button>
          
          {showTimePicker && mounted && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-4 justify-center">
                {/* Hour */}
                <div className="flex flex-col items-center">
                  <button
                    {...hourIncLongPress.handlers}
                    onClick={() => {
                      let newHour = tempHour === 12 ? 1 : tempHour + 1
                      setTempHour(newHour)
                    }}
                    className={cn(
                      "w-12 h-6 rounded-t-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                      hourIncLongPress.isPressed && "bg-blue-300 scale-110"
                    )}
                    aria-label="Increment hour"
                  >
                    ▲
                  </button>
                  <motion.button
                    key={tempHour}
                    onClick={() => {
                      let newHour = tempHour === 12 ? 1 : tempHour + 1
                      setTempHour(newHour)
                    }}
                    className={cn(
                      "w-12 h-16 rounded-b-lg bg-blue-200 text-blue-600 text-4xl font-semibold flex items-center justify-center select-none",
                    )}
                    aria-label="Set hour"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tempHour}
                  </motion.button>
                  <button
                    {...hourDecLongPress.handlers}
                    onClick={() => {
                      let newHour = tempHour === 1 ? 12 : tempHour - 1
                      setTempHour(newHour)
                    }}
                    className={cn(
                      "w-12 h-6 rounded-b-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                      hourDecLongPress.isPressed && "bg-blue-300 scale-110"
                    )}
                    aria-label="Decrement hour"
                  >
                    ▼
                  </button>
                </div>
      
                {/* Colon */}
                <span className="text-4xl font-semibold text-black select-none">:</span>
      
                {/* Minute */}
                <div className="flex flex-col items-center">
                  <button
                    {...minuteIncLongPress.handlers}
                    onClick={() => {
                      let newMinute = (tempMinute + 1) % 60
                      setTempMinute(newMinute)
                    }}
                    className={cn(
                      "w-16 h-6 rounded-t-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                      minuteIncLongPress.isPressed && "bg-gray-400 scale-110"
                    )}
                    aria-label="Increment minute"
                  >
                    ▲
                  </button>
                  <motion.button
                    key={tempMinute}
                    onClick={() => {
                      let newMinute = (tempMinute + 1) % 60
                      setTempMinute(newMinute)
                    }}
                    className={cn(
                      "w-16 h-16 rounded-b-lg bg-gray-300 text-black text-4xl font-semibold flex items-center justify-center select-none",
                    )}
                    aria-label="Set minute"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {String(tempMinute).padStart(2, "0")}
                  </motion.button>
                  <button
                    {...minuteDecLongPress.handlers}
                    onClick={() => {
                      let newMinute = tempMinute === 0 ? 59 : tempMinute - 1
                      setTempMinute(newMinute)
                    }}
                    className={cn(
                      "w-16 h-6 rounded-b-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                      minuteDecLongPress.isPressed && "bg-gray-400 scale-110"
                    )}
                    aria-label="Decrement minute"
                  >
                    ▼
                  </button>
                </div>
      
                {/* AM/PM Toggle */}
                <div className="flex rounded-lg overflow-hidden border border-neutral-300 ml-2">
                  {(["AM", "PM"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTempAmPm(m)}
                      className={cn(
                        "px-4 py-2 text-sm font-semibold transition-all",
                        tempAmPm === m
                          ? "bg-blue-200 text-blue-600"
                          : "bg-white text-gray-400 hover:bg-gray-100"
                      )}
                      aria-label={`Set ${m}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => setShowTimePicker(false)}
                  className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-4 py-2 text-sm"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="secondary"
              className="rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-4 py-2 text-sm"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}