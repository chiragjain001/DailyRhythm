"use client"

import { Topbar } from "@/components/topbar"
import { Panel1 } from "@/components/panel-1"
import { Panel2 } from "@/components/panel-2"
import { Panel3 } from "@/components/panel-3"
import { NotificationScheduler } from "@/components/notification-scheduler"
export default function DashboardPage() {
  return (
      <main className="h-screen overflow-hidden bg-neutral-100">
        {/* Notification Scheduler - runs in background */}
        <NotificationScheduler />
        
        {/* Topbar */}
        <Topbar />

        {/* Desktop / Tablet Layout */}
        <div className="hidden md:block mx-auto max-w-8xl px-3 pb-3">
          <div className="mt-3 h-[calc(100vh-4rem-24px)] rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-black/5 flex flex-col">
            <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">
              {/* Left Column */}
              <section className="min-h-0 flex flex-col">
                <Panel1 />
              </section>

              {/* Middle Column */}
              <section className="min-h-0 flex flex-col">
                <Panel2 />
              </section>

              {/* Right Column */}
              <section className="min-h-0 flex flex-col">
                <Panel3 />
              </section>
            </div>
          </div>
        </div>

        {/* Mobile Layout (Swipe-based) */}
        <div className="flex h-[calc(100vh-4rem)] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:hidden">
          {/* Screen 1: Panel1 */}
          <section className="w-full shrink-0 snap-start px-2">
            <Panel1 />
          </section>

          {/* Screen 2: Panel2 */}
          <section className="w-full shrink-0 snap-start px-2">
            <Panel2 />
          </section>

          {/* Screen 3: Panel3 */}
          <section className="w-full shrink-0 snap-start px-2">
            <Panel3 />
          </section>
        </div>
      </main>
  )
}
