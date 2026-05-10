"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMindmateStore } from '@/store/use-mindmate-store'

// Achievement Level Interface
export interface AchievementLevel {
  id: 'bad' | 'good' | 'best'
  name: string
  emoji: string
  badge: string
  range: string
  colors: {
    gradient: string
    shadow: string
  }
}

// Achievement Levels Configuration
const levels: AchievementLevel[] = [
  {
    id: 'bad',
    name: 'Bad',
    emoji: '😞',
    badge: '💥',
    range: '0-40%',
    colors: {
      gradient: 'from-red-400 to-red-600',
      shadow: 'shadow-red-500/30'
    }
  },
  {
    id: 'good',
    name: 'Good',
    emoji: '😊',
    badge: '⭐',
    range: '40-89%',
    colors: {
      gradient: 'from-teal-400 to-teal-600',
      shadow: 'shadow-teal-500/30'
    }
  },
  {
    id: 'best',
    name: 'Best',
    emoji: '🏆',
    badge: '🎉',
    range: '90-110%',
    colors: {
      gradient: 'from-yellow-400 to-yellow-600',
      shadow: 'shadow-yellow-500/30'
    }
  }
]

// Component Props Interface
interface TodoAchievementProps {
  completionPercentage: number
  totalTasks: number
  completedTasks: number
  onLevelReached?: (level: AchievementLevel) => void
  className?: string
}

// Level States
type LevelState = 'inactive' | 'reached' | 'current'

// Sparkle Interface
interface Sparkle {
  id: string
  x: number
  y: number
  delay: number
}

const TodoAchievement: React.FC<TodoAchievementProps> = ({
  completionPercentage,
  totalTasks,
  completedTasks,
  onLevelReached,
  className = ''
}) => {
  // State management
  const [liquidWidth, setLiquidWidth] = useState(0)
  const [levelStates, setLevelStates] = useState<Record<string, LevelState>>({
    bad: 'inactive',
    good: 'inactive',
    best: 'inactive'
  })
  const [currentLevel, setCurrentLevel] = useState<string>('bad')
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  // Calculate current performance level
  const getCurrentLevel = useCallback((percentage: number): string => {
    if (percentage <= 40) return 'bad'
    if (percentage < 90) return 'good'
    return 'best'
  }, [])

  // Activate level with animation
  const activateLevel = useCallback((levelId: string) => {
    setLevelStates(prev => ({
      ...prev,
      [levelId]: 'reached'
    }))

    // Trigger callback if provided
    const level = levels.find(l => l.id === levelId)
    if (level && onLevelReached) {
      onLevelReached(level)
    }

    // Create sparkle effects
    createSparkles(levelId)
  }, [onLevelReached])

  // Create sparkle effects
  const createSparkles = useCallback((levelId: string) => {
    const newSparkles: Sparkle[] = Array.from({ length: 8 }, (_, i) => ({
      id: `sparkle-${i}`,
      x: Math.random() * 80 + 10, // Keep between 10% and 90% to stay within container
      y: Math.random() * 60 + 20, // Keep between 20% and 80% to stay within container
      delay: Math.random() * 0.5
    }))

    setSparkles(newSparkles)

    setTimeout(() => {
      setSparkles([])
    }, 1500)
  }, [])

  // Effect to update achievement when completion percentage changes
  useEffect(() => {
    // Update liquid width immediately for smooth animation - allow up to 110%
    const cappedPercentage = Math.min(completionPercentage, 110)
    setLiquidWidth(cappedPercentage)

    // Reset all levels
    setLevelStates({
      bad: 'inactive',
      good: 'inactive',
      best: 'inactive'
    })

    // Sequential level activation with delays
    const timer1 = setTimeout(() => {
      if (completionPercentage > 0) {
        activateLevel('bad')
      }
    }, 300)

    const timer2 = setTimeout(() => {
      if (completionPercentage > 40) {
        activateLevel('good')
      }
    }, 800)

    const timer3 = setTimeout(() => {
      if (completionPercentage >= 90) {
        activateLevel('best')
        // Trigger sparkles for Best achievement
        createSparkles('best')
      }
    }, 1300)

    // Set current performance level
    const newCurrentLevel = getCurrentLevel(completionPercentage)
    setCurrentLevel(newCurrentLevel)

    // Mark current level as active
    const timer4 = setTimeout(() => {
      setLevelStates(prev => ({
        ...prev,
        [newCurrentLevel]: 'current'
      }))
    }, 100)

    // Cleanup timers on unmount or when percentage changes
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [completionPercentage, activateLevel, getCurrentLevel])

  // Get level style based on state
  const getLevelStyle = useCallback((levelId: string, state: LevelState) => {
    const baseClasses = 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-12 lg:h-12 xl:w-10 xl:h-10 rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl shadow-md transition-all duration-300 relative z-10'

    switch (state) {
      case 'inactive':
        return `${baseClasses} scale-90 opacity-30`
      case 'reached':
        return `${baseClasses} scale-100 opacity-70`
      case 'current':
        return `${baseClasses} scale-110 opacity-100`
      default:
        return baseClasses
    }
  }, [])

  // Memoized level components to prevent unnecessary re-renders
  const levelComponents = useMemo(() => {
    return levels.map((level, index) => {
      const state = levelStates[level.id]
      const isCurrent = level.id === currentLevel

      return (
        <div
          key={level.id}
          className={`absolute flex flex-col items-center gap-0.5 transition-all duration-800 ${
            state === 'inactive' ? 'scale-90 opacity-30' : 
            state === 'reached' ? 'scale-100 opacity-70' : 
            level.id === 'best' && state === 'current' ? 'scale-125 opacity-100 animate-bounce' :
            'scale-110 opacity-100'
          }`}
          style={{
            left: `${20 + index * 30}%`,
            transform: 'translateX(-50%)'
          }}
          role="button"
          tabIndex={0}
          aria-label={`${level.name} achievement level: ${level.range}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              // Could add interaction here if needed
            }
          }}
        >
          {/* Level Icon */}
          <div
            className={`${getLevelStyle(level.id, state)} bg-gradient-to-br ${level.colors.gradient} ${level.colors.shadow} hover:scale-110 hover:shadow-2xl ${
              level.id === 'best' && (state === 'current' || state === 'reached') ? 'shadow-yellow-400/50 shadow-2xl' : ''
            }`}
            style={{
              boxShadow: level.id === 'best' && (state === 'current' || state === 'reached') 
                ? '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)' 
                : undefined
            }}
          >
            <span className="text-2xl sm:text-4xl lg:text-2xl xl:text-xl">{level.emoji}</span>
          </div>

          {/* Level Badge */}
          <div className={`text-lg sm:text-2xl lg:text-lg xl:text-base transition-all duration-300`}>
            {level.badge}
          </div>

          {/* Level Name */}
          <span className={`text-sm lg:text-[0.65rem] xl:text-[0.6rem] font-medium transition-all duration-300 ${
            state === 'current' ? 'text-white font-bold' : 'text-white/70'
          }`}>
            {level.name}
          </span>
        </div>
      )
    })
  }, [levelStates, currentLevel, getLevelStyle])

  

  return (
    <div className={`relative ${className}`}>
      <Card className="rounded-3xl border-none bg-white shadow-sm max-w-4xl mx-auto">
        <CardHeader className="flex items-center justify-between px-6 py-4">
          <CardTitle className="text-base font-semibold">Task Complition</CardTitle>
        </CardHeader>
        <CardContent className="pt-2 pb-4 px-4">
          {/* Achievement Levels Container */}
          <div className="relative flex justify-between items-center h-36 sm:h-40 lg:h-28 xl:h-24 px-3 sm:px-4 lg:px-2 xl:px-1 mb-1 sm:mb-1 lg:mb-0.5 xl:mb-0.5 overflow-hidden">
            {levelComponents}
            
          </div>

          {/* Progress Track */}
          <div className="relative mb-2 sm:mb-3">
            <div className="absolute bottom-0 left-6 right-6 sm:left-8 sm:right-8 lg:left-8 lg:right-8 xl:left-8 xl:right-8 h-3 lg:h-2 xl:h-1.5 bg-white/20 rounded-full shadow-inner" />

            {/* Liquid Progress Bar */}
            <div
              className="absolute bottom-0 left-6 sm:left-8 lg:left-8 xl:left-8 h-3 lg:h-2 xl:h-1.5 bg-gradient-to-r from-red-400 via-teal-400 to-yellow-400 rounded-full transition-all duration-2000 ease-out shadow-lg shadow-white/50"
              style={{ 
                width: `calc(84% * ${liquidWidth / 100})`,
                // Add glow effect when over 100%
                boxShadow: liquidWidth > 100 ? '0 0 20px rgba(255, 215, 0, 0.8)' : undefined
              }}
            >

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default React.memo(TodoAchievement)
