"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Pause, Play, RotateCcw, Settings } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type Phase = "work" | "break"

export function FocusCard() {
  const [phase, setPhase] = useState<Phase>("work")
  const [workMin, setWorkMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60)
  const [running, setRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")

  return (
    <Card className="overflow-hidden rounded-3xl border-none bg-[#1F2F4A] text-white shadow-lg">
      <CardContent className="relative p-6 md:p-8">
        <div className="absolute right-6 top-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400/90 shadow">
            <CheckCircle2 className="h-5 w-5 text-[#1F2F4A]" />
          </div>
        </div>

        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-semibold leading-tight md:text-3xl">Complete the Project Proposal</h2>
            <p className="max-w-prose text-sm/6 text-white/80">
              Use a calm space and your favorite playlist. Outline, draft, and polish in focused intervals.
            </p>
          </div>

          {/* Progress ring */}
          <div
            className="relative flex h-28 w-28 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#BEF264 ${progress * 360}deg, rgba(255,255,255,.15) 0deg)`,
              transition: "background 0.5s ease-out",
            }}
            aria-label="pomodoro progress"
          >
            <div className="absolute inset-2 rounded-full bg-[#132033]" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-lg font-semibold">
                {mm}:{ss}
              </span>
              <span className="text-xs text-white/70">{phase === "work" ? "Focus" : "Break"}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button
            onClick={() => setRunning((r) => !r)}
            className="rounded-full bg-lime-300 px-6 text-[#1F2F4A] hover:bg-lime-200"
          >
            {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button
            variant="secondary"
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => {
              setPhase("work")
              setSecondsLeft(workMin * 60)
              setRunning(false)
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button
            variant="secondary"
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setShowSettings((s) => !s)}
          >
            <Settings className="mr-2 h-4 w-4" /> Intervals
          </Button>
        </div>

        {showSettings && (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              Work
              <input
                type="number"
                min={5}
                max={90}
                value={workMin}
                onChange={(e) => setWorkMin(Number(e.target.value))}
                className="w-16 rounded-md bg-white/10 px-2 py-1 text-white outline-none ring-1 ring-white/20"
              />
              min
            </label>
            <label className="flex items-center gap-2">
              Break
              <input
                type="number"
                min={3}
                max={30}
                value={breakMin}
                onChange={(e) => setBreakMin(Number(e.target.value))}
                className="w-16 rounded-md bg-white/10 px-2 py-1 text-white outline-none ring-1 ring-white/20"
              />
              min
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
