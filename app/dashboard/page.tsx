"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Topbar } from "@/components/topbar"
import { Panel1 } from "@/components/panel-1"
import { Panel2 } from "@/components/panel-2"
import { Panel3 } from "@/components/panel-3"

export default function DashboardPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dotsVisible, setDotsVisible] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show dots for 3 seconds then hide. Reset timer whenever panel changes.
  const flashDots = useCallback(() => {
    setDotsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setDotsVisible(false), 3000)
  }, [])

  // Show on first load
  useEffect(() => {
    flashDots()
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [flashDots])

  // Re-show whenever panel changes (user swipes)
  useEffect(() => {
    flashDots()
  }, [activeIndex, flashDots])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const width = container.clientWidth
    if (width > 0) {
      const index = Math.round(container.scrollLeft / width)
      if (index !== activeIndex) setActiveIndex(index)
    }
  }

  const scrollToPanel = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: "smooth",
      })
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-neutral-100">
      {/*
        CSS-only orientation switching.
        Both layouts are ALWAYS in the DOM (same HTML on server & client).
        @media (orientation) toggles which one is visible.
        Result: zero JS branching = zero hydration mismatch, ever.
      */}
      <style>{`
        .layout-landscape { display: none; }
        .layout-portrait  { display: flex; flex-direction: column; }
        @media (orientation: landscape) {
          .layout-landscape { display: block; }
          .layout-portrait  { display: none;  }
        }
        /* Portrait: panels render at natural height, sections scroll vertically */
        @media (orientation: portrait) {
          .portrait-scroll-section {
            overflow-y: auto;
            height: 100%;
          }
          .portrait-scroll-section > div:first-child {
            height: auto !important;
            min-height: unset !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <Topbar />

      {/* ─── LANDSCAPE: Full 3-column desktop layout ─── */}
      <div className="layout-landscape mx-auto max-w-8xl px-3 pb-3">
        <div className="mt-3 h-[calc(100vh-4rem-24px)] rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-black/5 flex flex-col">
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
            <section className="min-h-0 flex flex-col"><Panel1 /></section>
            <section className="min-h-0 flex flex-col"><Panel2 /></section>
            <section className="min-h-0 flex flex-col"><Panel3 /></section>
          </div>
        </div>
      </div>

      {/* ─── PORTRAIT: Swipe 3-panel mobile layout ─── */}
      <div className="layout-portrait h-[calc(100vh-4rem)] relative">
        {/* Panels Scroll Area — full height, cards untouched */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full h-full flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <section className="w-full shrink-0 snap-start px-2"><Panel1 /></section>
          <section className="w-full shrink-0 snap-start px-2 portrait-scroll-section"><Panel2 /></section>
          <section className="w-full shrink-0 snap-start px-2 portrait-scroll-section"><Panel3 /></section>
        </div>

        {/* Floating Cinematic Pager Indicator — Set at bottom-center, auto-hides after 3s */}
        <div
          className="absolute bottom-5 left-0 right-0 w-max mx-auto z-30 select-none pointer-events-auto transition-all duration-500 ease-in-out"
          style={{ opacity: dotsVisible ? 1 : 0, transform: `translateY(${dotsVisible ? 0 : 8}px)` }}
          aria-hidden={!dotsVisible}
        >
          <div className="flex gap-2.5 items-center bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToPanel(i)}
                aria-label={`Go to panel ${i + 1}`}
                tabIndex={dotsVisible ? 0 : -1}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer focus:outline-none ${
                  activeIndex === i
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
