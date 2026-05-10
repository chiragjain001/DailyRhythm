"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Pause, Play, RotateCcw, Settings, Check, Clock, Edit2, Mic, MoreHorizontal, Trash2, GripVertical, Plus, X } from "lucide-react"
import { moodToEmoji, type Mood } from "@/store/use-mindmate-store"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

type Phase = "work" | "break"

import { Greet } from "./greet"
import { Pills } from "./pills"
import { AgendaList } from "./agenda-list"

export function Panel1() {
  const isMobile = useIsMobile()
  
  // States from FocusCard
  const [phase, setPhase] = useState<Phase>("work")
  const [workMin, setWorkMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60)
  const [running, setRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // AgendaList component handles its own state via useSupabaseTasks hook

  // Logic from FocusCard
  const total = useMemo(() => (phase === "work" ? workMin * 60 : breakMin * 60), [phase, workMin, breakMin])
  const progress = Math.min(1, Math.max(0, 1 - secondsLeft / total))

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // switch phase
          if (phase === "work") {
            setPhase("break")
            return breakMin * 60
          } else {
            setPhase("work")
            return workMin * 60
          }
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, phase, workMin, breakMin])

  useEffect(() => {
    // reset seconds when durations change
    setSecondsLeft(phase === "work" ? workMin * 60 : breakMin * 60)
  }, [workMin, breakMin, phase])

  // Task logic is now handled by AgendaList component

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex-shrink-0">
        <Greet />
      </div>
      <div className="flex-shrink-0">
        <Pills />
      </div>
      {/* Focus Card - Responsive */}      
      <Card className="rounded-2xl shadow-md bg-[#1F2F4A] text-white flex-shrink-0 overflow-hidden">
        <CardContent className={cn(
          "relative flex flex-col pb-2",
          isMobile ? "p-3 pb-2" : "p-4 md:p-6 pb-2"
        )}>
          {/* Status Badge - Responsive positioning */}
          <div className={cn(
            "absolute",
            isMobile ? "right-3 top-3" : "right-4 top-4 md:right-6 md:top-6"
          )}>
            <div className={cn(
              "flex items-center justify-center rounded-full bg-lime-400/90 shadow",
              isMobile ? "h-7 w-7" : "h-8 w-8 md:h-9 md:w-9"
            )}>
              <CheckCircle2 className={cn(
                "text-[#1F2F4A]",
                isMobile ? "h-4 w-4" : "h-4 w-4 md:h-5 md:w-5"
              )} />
            </div>
          </div>

          {/* Main Content - Responsive layout */}
          <div className={cn(
            "flex gap-2 flex-1 min-h-0",
            isMobile 
              ? "flex-col items-center text-center" 
              : "flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:text-left md:gap-4"
          )}>
            {/* Text Content */}
            <div className={cn(
              isMobile ? "order-2 mt-2" : "order-1"
            )}>
              <h2 className={cn(
                "font-semibold leading-tight text-white",
                isMobile 
                  ? "text-base mb-1" 
                  : "text-lg mb-1 sm:text-xl md:text-2xl"
              )}>
                Complete the Imp Task
              </h2>
              <p className={cn(
                "text-white/80 line-clamp-2",
                isMobile 
                  ? "text-xs leading-tight max-w-[280px]" 
                  : "text-xs leading-tight max-w-prose sm:text-sm/5"
              )}>
                Use a calm space and your favorite playlist. Outline, draft, and polish in focused intervals.
              </p>
            </div>

            {/* Progress Ring - Responsive sizing */}
            <div className={cn(
              "order-1 flex-shrink-0",
              isMobile ? "order-1" : "order-2"
            )}>
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full flex-shrink-0",
                  isMobile ? "h-16 w-16" : "h-20 w-20 sm:h-24 sm:w-24"
                )}
                style={{
                  background: `conic-gradient(#BEF264 ${progress * 360}deg, rgba(255,255,255,.15) 0deg)`,
                  transition: "background 0.5s ease-out",
                }}
                aria-label="pomodoro progress"
              >
                <div className="absolute inset-2 rounded-full bg-[#132033]" />
                <div className="relative z-10 flex flex-col items-center">
                  <span className={cn(
                    "font-semibold text-white",
                    isMobile ? "text-base" : "text-lg"
                  )}>
                    {mm}:{ss}
                  </span>
                  <span className={cn(
                    "text-white/70",
                    isMobile ? "text-xs" : "text-xs"
                  )}>
                    {phase === "work" ? "Focus" : "Break"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Buttons - Responsive layout */}
          <div className={cn(
            "flex items-center gap-2 flex-shrink-0",
            isMobile 
              ? "mt-2 flex-wrap justify-center" 
              : "mt-3 flex-row"
          )}>
            <Button
              onClick={() => setRunning((r) => !r)}
              className={cn(
                "rounded-full bg-lime-300 text-[#1F2F4A] hover:bg-lime-200 font-medium",
                isMobile 
                  ? "px-4 py-2 text-sm" 
                  : "px-6 py-2"
              )}
            >
              {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Pause" : "Start"}
            </Button>
            
            <Button
              variant="secondary"
              className={cn(
                "rounded-full bg-white/10 text-white hover:bg-white/20",
                isMobile 
                  ? "px-3 py-2" 
                  : "px-4 py-2"
              )}
              onClick={() => {
                setPhase("work")
                setSecondsLeft(workMin * 60)
                setRunning(false)
              }}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> 
              {isMobile ? "" : "Reset"}
            </Button>
            
            <Button
              variant="secondary"
              className={cn(
                "rounded-full bg-white/10 text-white hover:bg-white/20",
                isMobile 
                  ? "px-3 py-2" 
                  : "px-4 py-2"
              )}
              onClick={() => setShowSettings((s) => !s)}
            >
              <Settings className="mr-1 h-4 w-4" /> 
              {isMobile ? "" : "Intervals"}
            </Button>
          </div>

          {/* Settings Panel - Responsive */}
          {showSettings && (
            <div className={cn(
              "mt-2 text-sm flex-shrink-0",
              isMobile 
                ? "flex flex-col gap-2" 
                : "flex items-center gap-3"
            )}>
              <label className="flex items-center gap-2">
                <span className="text-white/90">Work</span>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={workMin}
                  onChange={(e) => setWorkMin(Number(e.target.value))}
                  className={cn(
                    "rounded-md bg-white/10 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-lime-400/50",
                    isMobile 
                      ? "w-14 px-2 py-1 text-sm" 
                      : "w-16 px-2 py-1"
                  )}
                />
                <span className="text-white/70">min</span>
              </label>
              
              <label className="flex items-center gap-2">
                <span className="text-white/90">Break</span>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={breakMin}
                  onChange={(e) => setBreakMin(Number(e.target.value))}
                  className={cn(
                    "rounded-md bg-white/10 text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-lime-400/50",
                    isMobile 
                      ? "w-14 px-2 py-1 text-sm" 
                      : "w-16 px-2 py-1"
                  )}
                />
                <span className="text-white/70">min</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda List - Expands to fill remaining space */}
      <div className="flex-1 min-h-0">
        <AgendaList />
      </div>
    </div>
  )
}
