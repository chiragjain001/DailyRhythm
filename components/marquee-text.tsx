"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface MarqueeTextProps {
  children: React.ReactNode
  className?: string
}

export function MarqueeText({ children, className }: MarqueeTextProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const [shouldMarquee, setShouldMarquee] = useState(false)
  const [duration, setDuration] = useState(10) // default 10s

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const { scrollWidth, offsetWidth } = textRef.current
        const isOverflowing = scrollWidth > offsetWidth
        setShouldMarquee(isOverflowing)

        if (isOverflowing) {
          // Dynamic speed: longer text scrolls slower
          // Base duration 5s, add 0.1s per character, max 20s
          const textLength = textRef.current.textContent?.length || 0
          const calculatedDuration = Math.min(5 + textLength * 0.1, 20)
          setDuration(calculatedDuration)
        }
      }
    }

    checkOverflow()

    // Check on resize
    const handleResize = () => checkOverflow()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [children])

  return (
    <div
      ref={textRef}
      className={cn(
        "overflow-hidden w-full",
        className
      )}
    >
      <div
        className={cn(
          "whitespace-nowrap",
          shouldMarquee && "animate-marquee"
        )}
        style={
          shouldMarquee
            ? {
                animationDuration: `${duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }
            : {}
        }
      >
        {children}
      </div>
    </div>
  )
}
