import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isToday, 
  isBefore,
  startOfDay
} from "date-fns"

export interface FallbackWeeklyDayData {
  date: Date
  dayName: string
  dayShort: string
  completedTasks: number
  totalTasks: number
  completedHabits: number
  totalHabits: number
  completedWellness: number
  totalWellness: number
  completionPercentage: number
  isCurrentDay: boolean
  isPastDay: boolean
  isFutureDay: boolean
}

export function useFallbackWeeklyData() {
  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysInWeek.map((date): FallbackWeeklyDayData => {
      const dayStart = startOfDay(date);
      const isCurrentDay = isToday(date);
      const isPastDay = isBefore(date, startOfDay(now)) && !isCurrentDay;
      const isFutureDay = !isPastDay && !isCurrentDay;

      let completedTasks = 0;
      let totalTasks = 0;
      let completedHabits = 0;
      let totalHabits = 0;
      let completedWellness = 0;
      let totalWellness = 0;

      if (!isFutureDay) {
        // Generate demo data based on day of week
        const dayIndex = date.getDay();
        
        // Base values
        totalTasks = 3 + (dayIndex % 3);
        totalHabits = 4;
        totalWellness = 6;

        if (isCurrentDay) {
          // Current day - partial completion
          completedTasks = Math.floor(totalTasks * 0.6);
          completedHabits = Math.floor(totalHabits * 0.5);
          completedWellness = Math.floor(totalWellness * 0.7);
        } else if (isPastDay) {
          // Past days - varied completion rates
          const baseRate = 0.6 + Math.sin(dayIndex * 0.8) * 0.3;
          completedTasks = Math.max(0, Math.min(totalTasks, Math.round(totalTasks * baseRate)));
          completedHabits = Math.max(0, Math.min(totalHabits, Math.round(totalHabits * (baseRate + 0.1))));
          completedWellness = Math.max(0, Math.min(totalWellness, Math.round(totalWellness * (baseRate - 0.1))));
        }
      }

      const totalItems = totalTasks + totalHabits + totalWellness;
      const completedItems = completedTasks + completedHabits + completedWellness;
      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        date,
        dayName: format(date, 'EEEE'),
        dayShort: format(date, 'EE'),
        completedTasks,
        totalTasks,
        completedHabits,
        totalHabits,
        completedWellness,
        totalWellness,
        completionPercentage,
        isCurrentDay,
        isPastDay,
        isFutureDay
      };
    });
  }, []);

  return {
    weekData,
    loading: false,
    error: null,
    refetch: () => {
      // No-op for fallback data
    }
  };
}
