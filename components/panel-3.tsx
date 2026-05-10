"use client"

import { useMemo, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { DayFilter } from "./day-filter"
import { WeekHistory } from "./week-history"
import { WeeklyCompletionChart } from "./weekly-completion-chart"
import TodoAchievement from "./todo-achievement"
import { ProgressModalButton } from "./progress-modal-button"
import { useCompletionTracker } from "@/hooks/useCompletionTracker"

export function Panel3() {
  const {
    totalItems,
    completedItems,
    completionPercentage,
    breakdown,
    isLoading,
    hasItems,
    isFullyCompleted
  } = useCompletionTracker()
  
  const [forceUpdate, setForceUpdate] = useState(0)

  // Real-time completion tracking with debug logging
  useEffect(() => {
    console.log('🔄 Panel3 Real-time Update:', { 
      timestamp: new Date().toISOString(),
      completionPercentage, 
      totalItems, 
      completedItems, 
      isFullyCompleted,
      breakdown
    })
    setForceUpdate(prev => prev + 1)
  }, [completionPercentage, totalItems, completedItems, breakdown, isFullyCompleted])
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-4 p-4 overflow-hidden">
      {/* Week History Section */}
      <Card className="flex-1 min-h-[250px] overflow-y-auto rounded-2xl shadow-md bg-white p-4">

        
        {/* <div className="mb-2">
          <DayFilter />
        </div> */}

       {/* <WeekHistory /> */}

        <div className="mt-4">
          {/* Progress Modal Button */}
          <ProgressModalButton />
          
          {/* Original Achievement Component */}
          <div className="mt-4">
            <TodoAchievement
              key={`achievement-${completedItems}-${totalItems}-${forceUpdate}`}
              completionPercentage={completionPercentage}
              totalTasks={totalItems}
              completedTasks={completedItems}
              className="max-w-4xl mx-auto"
            />
          </div>
        </div>
      </Card>

      {/* Chart Section */}
      <div className="flex-1 min-h-[250px] overflow-y-auto">
        <WeeklyCompletionChart />
      </div>
    </div>
  )
}
