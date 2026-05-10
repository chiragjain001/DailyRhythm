"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Priority } from "@/store/use-mindmate-store"

interface PrioritySelectorProps {
  selectedPriority?: Priority
  onPrioritySelect: (priority: Priority) => void
  className?: string
}

const priorityOptions = [
  {
    value: "important" as Priority,
    label: "Important",
    emoji: "🔴",
    bgColor: "bg-red-50 hover:bg-red-100",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    selectedBg: "bg-red-100",
    selectedBorder: "border-red-300",
  },
  {
    value: "today" as Priority,
    label: "Daily",
    emoji: "🟡",
    bgColor: "bg-yellow-50 hover:bg-yellow-100",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
    selectedBg: "bg-yellow-100",
    selectedBorder: "border-yellow-300",
  },
  {
    value: "habit" as Priority,
    label: "Later",
    emoji: "🟢",
    bgColor: "bg-green-50 hover:bg-green-100",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    selectedBg: "bg-green-100",
    selectedBorder: "border-green-300",
  },
]

export function PrioritySelector({ selectedPriority, onPrioritySelect, className }: PrioritySelectorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-neutral-700 mb-3">Select Priority</h3>
        <div className="space-y-2">
          {priorityOptions.map((option) => {
            const isSelected = selectedPriority === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => onPrioritySelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  "hover:scale-[1.02] hover:shadow-sm",
                  isSelected
                    ? cn(option.selectedBg, option.selectedBorder, "shadow-sm")
                    : cn(option.bgColor, option.borderColor)
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" role="img" aria-label={option.label}>
                    {option.emoji}
                  </span>
                  <span className={cn(
                    "font-medium text-sm",
                    isSelected ? option.textColor : "text-neutral-700"
                  )}>
                    {option.label}
                  </span>
                </div>
                
                {isSelected && (
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full",
                    option.textColor === "text-red-700" ? "bg-red-200" :
                    option.textColor === "text-yellow-700" ? "bg-yellow-200" :
                    "bg-green-200"
                  )}>
                    <Check className="w-3 h-3 text-neutral-700" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
