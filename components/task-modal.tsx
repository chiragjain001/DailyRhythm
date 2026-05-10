"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Clock, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Priority, Task } from "@/store/use-mindmate-store"
import { PrioritySelector } from "./priority-selector"
import { useLongPress } from "@/hooks/use-long-press"

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Omit<Task, "id" | "progress" | "completed">) => void
  editTask?: Task | null
  title?: string
}

export function TaskModal({ isOpen, onClose, onSubmit, editTask, title = "Add New Task" }: TaskModalProps) {
  const [taskTitle, setTaskTitle] = useState("")
  const [selectedPriority, setSelectedPriority] = useState<Priority>("today")
  const [assignee, setAssignee] = useState("")
  const [time, setTime] = useState("")
  const [showTimePicker, setShowTimePicker] = useState(false)
  // Temporary states for picker
  const [tempHour, setTempHour] = useState(7)
  const [tempMinute, setTempMinute] = useState(0)
  const [tempAmPm, setTempAmPm] = useState<"AM" | "PM">("AM")

  // Ref for time display button to scroll into view on "Set Time"
  const timeDisplayRef = useRef<HTMLButtonElement>(null)

  // Long-press handlers with 300ms delay for smooth continuous change
  const hourIncLongPress = useLongPress(() => setTempHour(prev => prev === 12 ? 1 : prev + 1), 300)
  const hourDecLongPress = useLongPress(() => setTempHour(prev => prev === 1 ? 12 : prev - 1), 300)
  const minuteIncLongPress = useLongPress(() => setTempMinute(prev => (prev + 1) % 60), 300)
  const minuteDecLongPress = useLongPress(() => setTempMinute(prev => prev === 0 ? 59 : prev - 1), 300)

  // Initialize form with edit task data
  useEffect(() => {
    if (editTask) {
      setTaskTitle(editTask.title)
      setSelectedPriority(editTask.priority)
      setAssignee(editTask.assignee || "")
      setTime(editTask.time || "")
    } else {
      // Reset form for new task
      setTaskTitle("")
      setSelectedPriority("today")
      setAssignee("")
      setTime("")
    }
  }, [editTask, isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = () => {
    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle) return
    
    // Time is required for all tasks
    if (!time) return

    onSubmit({
      title: trimmedTitle,
      priority: selectedPriority,
      assignee: assignee.trim() || undefined,
      time: time || undefined,
    })

    // Reset form
    setTaskTitle("")
    setSelectedPriority("today")
    setAssignee("")
    setTime("")
    onClose()
  }

  // Update time immediately when picker values change
  useEffect(() => {
    const newTime = `${tempHour}:${String(tempMinute).padStart(2, "0")} ${tempAmPm}`
    setTime(newTime)
  }, [tempHour, tempMinute, tempAmPm])

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Background overlay with blur effect */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-neutral-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </Button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Task Title</label>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <Plus className="h-4 w-4 text-neutral-400" />
              <input
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit()
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
            <label className="text-sm font-medium text-neutral-700">Assignee (Optional)</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Enter assignee name..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400"
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">
              Time <span className="text-red-500">(Required)</span>
            </label>
            <div className="relative">
              <button
                ref={timeDisplayRef}
                type="button"
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left hover:bg-neutral-100 transition-colors",
                  !time
                    ? "border-red-300 bg-red-50"
                    : "border-neutral-200 bg-neutral-50"
                )}
              >
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-600">
                  {time || "Set time"}
                </span>
              </button>

              {showTimePicker && (
                <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    {/* Hour */}
                    <div className="flex flex-col items-center">
                      {(() => {
                        const { handlers: incHandlers, isPressed: incPressed } = hourIncLongPress
                        const { handlers: decHandlers, isPressed: decPressed } = hourDecLongPress
                        return (
                          <>
                            <motion.button
                              {...incHandlers}
                              onClick={() => setTempHour(prev => prev === 12 ? 1 : prev + 1)} // Single click increment
                              className={cn(
                                "w-12 h-6 rounded-t-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                                incPressed && "bg-blue-300 scale-110"
                              )}
                              aria-label="Increment hour"
                              whileTap={{ scale: 0.95 }}
                            >
                              ▲
                            </motion.button>
                            <motion.button
                              key={tempHour}
                              onClick={() => setTempHour(prev => prev === 12 ? 1 : prev + 1)}
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
                            <motion.button
                              {...decHandlers}
                              onClick={() => setTempHour(prev => prev === 1 ? 12 : prev - 1)} // Single click decrement
                              className={cn(
                                "w-12 h-6 rounded-b-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                                decPressed && "bg-blue-300 scale-110"
                              )}
                              aria-label="Decrement hour"
                              whileTap={{ scale: 0.95 }}
                            >
                              ▼
                            </motion.button>
                          </>
                        )
                      })()}
                    </div>

                    {/* Colon */}
                    <span className="text-4xl font-semibold text-black select-none">:</span>

                    {/* Minute */}
                    <div className="flex flex-col items-center">
                      {(() => {
                        const { handlers: incHandlers, isPressed: incPressed } = minuteIncLongPress
                        const { handlers: decHandlers, isPressed: decPressed } = minuteDecLongPress
                        return (
                          <>
                            <motion.button
                              {...incHandlers}
                              onClick={() => setTempMinute(prev => (prev + 1) % 60)} // Single click increment
                              className={cn(
                                "w-16 h-6 rounded-t-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                                incPressed && "bg-gray-400 scale-110"
                              )}
                              aria-label="Increment minute"
                              whileTap={{ scale: 0.95 }}
                            >
                              ▲
                            </motion.button>
                            <motion.button
                              key={tempMinute}
                              onClick={() => setTempMinute(prev => (prev + 1) % 60)}
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
                            <motion.button
                              {...decHandlers}
                              onClick={() => setTempMinute(prev => prev === 0 ? 59 : prev - 1)} // Single click decrement
                              className={cn(
                                "w-16 h-6 rounded-b-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm",
                                decPressed && "bg-gray-400 scale-110"
                              )}
                              aria-label="Decrement minute"
                              whileTap={{ scale: 0.95 }}
                            >
                              ▼
                            </motion.button>
                          </>
                        )
                      })()}
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
                  onClick={() => {
                    setShowTimePicker(false)
                    // Smooth transition to time display view
                    setTimeout(() => {
                      timeDisplayRef.current?.scrollIntoView({ behavior: "smooth" })
                    }, 100)
                  }}
                  className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-4 py-2 text-sm"
                >
                  Done
                </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 flex-shrink-0">
          <Button
            onClick={onClose}
            variant="secondary"
            className="rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!taskTitle.trim() || !time}
            className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="mr-2 h-4 w-4" />
            {editTask ? "Update Task" : "Add Task"}
          </Button>
        </div>
      </div>
    </div>
  )
}
