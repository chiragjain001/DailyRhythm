import { useState, useRef, useCallback } from "react"

/**
 * useLongPress hook for handling single click and continuous hold actions.
 * @param callback - Function to call on each increment/decrement step.
 * @param delay - Delay before continuous action starts (default 300ms).
 * @param interval - Interval between continuous actions (default 100ms).
 */
export function useLongPress(
  callback: () => void,
  delay: number = 300,
  interval: number = 100
) {
  const [isPressed, setIsPressed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = useCallback(() => {
    setIsPressed(true)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, interval)
    }, delay)
  }, [callback, delay, interval])

  const stop = useCallback(() => {
    setIsPressed(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    }
  }
}
