"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeartPulse, BookOpen, CheckCircle2, Plus, X, ChevronRight, Trash2, Clock } from "lucide-react"
import { useSupabaseHabits } from "@/hooks/useSupabaseHabits"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { MarqueeText } from "@/components/marquee-text"

export function HabitsCard() {
  const { habits, toggleHabit, addHabit, deleteHabit, loading, error } = useSupabaseHabits()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [habitTitle, setHabitTitle] = useState("")
  const [habitNote, setHabitNote] = useState("")
  const [habitTime, setHabitTime] = useState("")
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [tempHour, setTempHour] = useState(7)
  const [tempMinute, setTempMinute] = useState(0)
  const [tempAmPm, setTempAmPm] = useState<"AM" | "PM">("AM")
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null)
  const icons = [BookOpen, HeartPulse, CheckCircle2]

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showAddModal) setShowAddModal(false)
        if (showViewModal) setShowViewModal(false)
      }
    }
    
    if (showAddModal || showViewModal) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [showAddModal, showViewModal])

  // Update time immediately when picker values change
  useEffect(() => {
    const newTime = `${tempHour}:${String(tempMinute).padStart(2, "0")} ${tempAmPm}`
    setHabitTime(newTime)
  }, [tempHour, tempMinute, tempAmPm])

  const handleAddHabit = async () => {
    const title = habitTitle.trim()
    if (!title || !habitTime) return

    try {
      await addHabit({
        title,
        note: habitNote.trim() || undefined,
        time: habitTime,
      })

      setHabitTitle("")
      setHabitNote("")
      setHabitTime("")
      setShowAddModal(false)
    } catch (err) {
      console.error('Failed to add habit:', err)
    }
  }

  const handleDeleteHabit = async (id: string) => {
    setDeletingHabitId(id)
    try {
      await deleteHabit(id)
    } catch (err) {
      console.error('Failed to delete habit:', err)
    } finally {
      setDeletingHabitId(null)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm">
        <CardHeader className="px-5 pb-1 pt-4 md:px-6">
          <CardTitle className="text-base font-semibold">Habits</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 flex items-center justify-center min-h-[200px]">
          <div className="text-neutral-500">Loading habits...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm">
        <CardHeader className="px-5 pb-1 pt-4 md:px-6">
          <CardTitle className="text-base font-semibold">Habits</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 flex items-center justify-center min-h-[200px]">
          <div className="text-red-500">Error loading habits: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border-none bg-white shadow-sm">
      <CardHeader className="px-5 pb-1 pt-4 md:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Habits</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Add habit" onClick={() => setShowAddModal(true)}>
              <Plus className="h-5 w-5 text-neutral-500" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="View habits" onClick={() => setShowViewModal(true)}>
              <ChevronRight className="h-5 w-5 text-neutral-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 md:px-6 divide-y divide-neutral-200">
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500 font-medium">No habits yet</p>
            <p className="text-xs text-neutral-400 mt-1">Click + to add your first habit</p>
          </div>
        ) : (
          habits.map((h, i) => {
            const Icon = icons[i % icons.length]
            return (
              <div
                key={h.id}
                className={cn(
                  "flex items-center rounded-2xl border border-neutral-100 p-4 transition-all duration-1000 ease-in-out",
                  h.completedToday
                    ? "bg-gradient-to-r from-white via-yellow-400 via-orange-500 to-red-700 animate-pulse"
                    : "bg-neutral-50",
                  deletingHabitId === h.id && "transform translate-x-full"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  
                  <div className="min-w-0 flex-1">
                    <MarqueeText className="text-sm font-medium text-neutral-900">{h.title}</MarqueeText>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {h.note || 'Personal habit'}
                      </span>
                      {h.time && (
                        <>
                          <span>•</span>
                          <span>{h.time}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto flex-shrink-0">
                  <span className={cn(
                    "flex items-center rounded-full px-2 py-1 text-xs mb-0 space-x-1",
                    h.streak > 0 
                      ? "bg-purple-100 text-purple-700 font-semibold" 
                      : "bg-neutral-200 text-neutral-500"
                  )}>
                    <span>{h.streak}</span>
                    <span>🔥</span>
                  </span>
                  <Button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Add visual feedback immediately
                      const button = e.currentTarget;
                      button.style.transform = 'scale(0.95)';
                      setTimeout(() => {
                        button.style.transform = 'scale(1)';
                      }, 150);
                      
                      try {
                        await toggleHabit(h.id);
                      } catch (error) {
                        console.error('Failed to toggle habit:', error);
                      }
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    size="sm"
                    className={
                      h.completedToday
                        ? "rounded-full bg-gradient-to-r from-white via-yellow-400 via-orange-500 to-red-700 text-[#1F2F4A] transition-all duration-1000 ease-in-out animate-pulse hover:bg-gradient-to-r hover:from-white hover:via-yellow-400 hover:via-orange-500 hover:to-red-700 active:scale-95"
                        : "rounded-full transition-all duration-1000 ease-in-out active:scale-95"
                    }
                    variant={h.completedToday ? "default" : "secondary"}
                  >
                    {h.completedToday ? "Done" : "Mark"}
                  </Button>
                  <Button
                    onClick={() => handleDeleteHabit(h.id)}
                    size="sm"
                    variant="ghost"
                    className="rounded-full p-1 hover:bg-red-100"
                    aria-label="Delete habit"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </CardContent>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false)
            }
          }}
        >
          {/* Background overlay with blur effect */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-2xl h-[50vh] bg-white rounded-3xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col sm:w-2/3 md:w-1/2">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">Add New Habit</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddModal(false)}
                className="rounded-full hover:bg-neutral-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </Button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Habit Title Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Habit Title</label>
                  <input
                    type="text"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    placeholder="e.g., Read 20 pages, Exercise 30 min"
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
                    autoFocus
                  />
                </div>

                {/* Habit Note Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">Note (Optional)</label>
                  <textarea
                    value={habitNote}
                    onChange={(e) => setHabitNote(e.target.value)}
                    placeholder="Add any notes or reminders..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Time Picker */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Time <span className="text-red-500">(Required)</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left hover:bg-neutral-100 transition-colors",
                        !habitTime
                          ? "border-red-300 bg-red-50"
                          : "border-neutral-200 bg-neutral-50"
                      )}
                    >
                      <Clock className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        {habitTime || "Set time"}
                      </span>
                    </button>

                    {showTimePicker && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
                        <div className="flex items-center gap-2 mb-4 justify-center">
                          {/* Hour */}
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => setTempHour(prev => prev === 12 ? 1 : prev + 1)}
                              className="w-12 h-6 rounded-t-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm"
                              aria-label="Increment hour"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => setTempHour(prev => prev === 12 ? 1 : prev + 1)}
                              className="w-12 h-16 rounded-b-lg bg-blue-200 text-blue-600 text-4xl font-semibold flex items-center justify-center select-none"
                              aria-label="Set hour"
                            >
                              {tempHour}
                            </button>
                            <button
                              onClick={() => setTempHour(prev => prev === 1 ? 12 : prev - 1)}
                              className="w-12 h-6 rounded-b-lg bg-blue-200 text-blue-600 text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm"
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
                              onClick={() => setTempMinute(prev => (prev + 1) % 60)}
                              className="w-16 h-6 rounded-t-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm"
                              aria-label="Increment minute"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => setTempMinute(prev => (prev + 1) % 60)}
                              className="w-16 h-16 rounded-b-lg bg-gray-300 text-black text-4xl font-semibold flex items-center justify-center select-none"
                              aria-label="Set minute"
                            >
                              {String(tempMinute).padStart(2, "0")}
                            </button>
                            <button
                              onClick={() => setTempMinute(prev => prev === 0 ? 59 : prev - 1)}
                              className="w-16 h-6 rounded-b-lg bg-gray-300 text-black text-xl font-semibold flex items-center justify-center select-none transition-all hover:scale-105 active:scale-95 shadow-sm"
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
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-100 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="rounded-full px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddHabit}
                disabled={!habitTitle.trim() || !habitTime}
                className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-6"
              >
                Add Habit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Habits Modal */}
      {showViewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false)
            }
          }}
        >
          {/* Background overlay with blur effect */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-2xl h-[80vh] bg-white rounded-3xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col sm:w-2/3 md:w-1/2">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">Current Habits</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowViewModal(false)}
                className="rounded-full hover:bg-neutral-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </Button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {habits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-neutral-400 mb-4">
                      <BookOpen className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="text-neutral-600 font-medium mb-2">No habits yet</p>
                    <p className="text-sm text-neutral-400 text-center">Start building healthy habits today</p>
                  </div>
                ) : (
                  habits.map((habit, i) => {
                    const Icon = icons[i % icons.length]
                    return (
                      <div
                        key={habit.id}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border border-neutral-100 transition-all duration-1000 ease-in-out",
                          habit.completedToday
                            ? "bg-gradient-to-r from-white via-yellow-400 via-orange-500 to-red-700 animate-pulse hover:bg-gradient-to-r hover:from-white hover:via-yellow-400 hover:via-orange-500 hover:to-red-700"
                            : "bg-neutral-50 hover:bg-neutral-100",
                          deletingHabitId === habit.id && "transform translate-x-full"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-200/80">
                          <Icon className="h-5 w-5 text-neutral-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <MarqueeText className="text-sm font-medium text-neutral-900">{habit.title}</MarqueeText>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              {habit.note || 'Personal habit'}
                            </span>
                            {habit.time && (
                              <>
                                <span>•</span>
                                <span>{habit.time}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">{habit.streak} 🔥</span>
                          <Button
                            onClick={() => toggleHabit(habit.id)}
                            size="sm"
                            className={cn(
                              "rounded-full px-4 py-2 text-xs font-medium transition-all duration-1000 ease-in-out",
                              habit.completedToday
                                ? "bg-gradient-to-r from-white via-yellow-400 via-orange-500 to-red-700 text-[#1F2F4A] animate-pulse hover:bg-gradient-to-r hover:from-white hover:via-yellow-400 hover:via-orange-500 hover:to-red-700"
                                : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                            )}
                          >
                            {habit.completedToday ? "Done" : "Mark"}
                          </Button>
                          <Button
                            onClick={() => handleDeleteHabit(habit.id)}
                            size="sm"
                            variant="ghost"
                            className="rounded-full p-1 hover:bg-red-100"
                            aria-label="Delete habit"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-center p-6 border-t border-neutral-100 flex-shrink-0">
              <Button
                onClick={() => setShowViewModal(false)}
                className="rounded-full bg-lime-400 text-[#1F2F4A] hover:bg-lime-300 px-8"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
