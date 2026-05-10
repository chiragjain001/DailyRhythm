"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabaseWellness } from "@/hooks/useSupabaseWellness"
import { Check, ChevronRight, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export function WellnessChecklist() {
  const { wellness, toggleWellness, loading, error } = useSupabaseWellness()
  const [showModal, setShowModal] = useState(false)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false)
      }
    }
    
    if (showModal) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [showModal])

  if (loading) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm">
        <CardHeader className="px-5 pb-1 pt-4 md:px-6">
          <CardTitle className="text-base font-semibold">Wellness Checklist</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5 md:px-6 flex items-center justify-center min-h-[200px]">
          <div className="text-neutral-500">Loading wellness activities...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl border-none bg-white shadow-sm">
        <CardHeader className="px-5 pb-1 pt-4 md:px-6">
          <CardTitle className="text-base font-semibold">Wellness Checklist</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5 md:px-6 flex items-center justify-center min-h-[200px]">
          <div className="text-red-500">Error loading activities: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-3xl border-none bg-white shadow-sm">
      <CardHeader className="px-5 pb-1 pt-4 md:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Wellness Checklist</CardTitle>
          <Button variant="ghost" size="icon" aria-label="View all activities" onClick={() => setShowModal(true)}>
            <ChevronRight className="h-5 w-5 text-neutral-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 px-4 pb-5 md:grid-cols-3 md:px-6">
        {wellness.slice(0, 6).map((w) => (
          <button
            key={w.id}
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
                await toggleWellness(w.id);
              } catch (error) {
                console.error('Failed to toggle wellness:', error);
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition active:scale-95",
              w.completed ? "border-lime-200 bg-lime-50" : "border-neutral-100 bg-neutral-50 hover:bg-neutral-100",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium",
                w.completed ? "bg-lime-200 text-[#1F2F4A]" : "bg-neutral-200/70 text-neutral-700",
              )}
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="text-xs text-neutral-700">{w.title}</span>
          </button>
        ))}
      </CardContent>

      {/* Wellness Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          {/* Background overlay with blur effect */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-2xl h-[50vh] bg-white rounded-3xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col sm:w-2/3 md:w-1/2">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900">Wellness Activities</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowModal(false)}
                className="rounded-full hover:bg-neutral-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-neutral-500" />
              </Button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wellness.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-12">
                    <div className="text-neutral-400 mb-4">
                      <Check className="h-16 w-16 mx-auto" />
                    </div>
                    <p className="text-neutral-600 font-medium mb-2">No wellness activities yet</p>
                    <p className="text-sm text-neutral-400 text-center">Activities will appear here once added</p>
                  </div>
                ) : (
                  wellness.slice(0, 6).map((w) => (
                    <button
                      key={w.id}
                      onClick={() => toggleWellness(w.id)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:scale-[1.02]",
                        w.completed ? "border-lime-200 bg-lime-50 shadow-sm" : "border-neutral-100 bg-neutral-50 hover:bg-neutral-100",
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                            w.completed ? "bg-lime-200 text-[#1F2F4A]" : "bg-neutral-200/70 text-neutral-700",
                          )}
                        >
                          <Check className="h-5 w-5" />
                        </span>
                        <span className={cn(
                          "text-xs px-3 py-1.5 rounded-full font-medium",
                          w.completed ? "bg-lime-100 text-lime-700" : "bg-neutral-100 text-neutral-500"
                        )}>
                          {w.completed ? "Completed" : "Pending"}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-800 font-medium leading-relaxed">{w.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-center p-6 border-t border-neutral-100 flex-shrink-0">
              <Button
                onClick={() => setShowModal(false)}
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
