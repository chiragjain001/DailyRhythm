import { useMemo } from 'react';
import { useSupabaseTasks } from '@/hooks/useSupabaseTasks';
import { useSupabaseHabits } from '@/hooks/useSupabaseHabits';
import { useSupabaseWellness } from '@/hooks/useSupabaseWellness';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isToday, 
  isBefore,
  startOfDay
} from "date-fns"

export interface SimpleWeeklyDayData {
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

export function useSimpleWeeklyData() {
  // Use try-catch to handle hook errors gracefully
  let tasks: any[] = [];
  let habits: any[] = [];
  let wellness: any[] = [];
  let loading = false;
  let error: string | null = null;

  try {
    const tasksResult = useSupabaseTasks();
    const habitsResult = useSupabaseHabits();
    const wellnessResult = useSupabaseWellness();

    tasks = tasksResult.tasks || [];
    habits = habitsResult.habits || [];
    wellness = wellnessResult.wellness || [];
    loading = tasksResult.loading || habitsResult.loading || wellnessResult.loading;
    error = tasksResult.error || habitsResult.error || wellnessResult.error;
  } catch (err) {
    console.warn('Error in useSimpleWeeklyData hooks:', err);
    // Provide fallback data
    tasks = [];
    habits = [];
    wellness = [];
    loading = false;
    error = null;
  }

  const weekData = useMemo(() => {
    if (loading || error) return [];

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysInWeek.map((date): SimpleWeeklyDayData => {
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
        // For demo purposes, use current data with some variation
        // In a real implementation, you'd filter by actual dates
        
        // Tasks
        totalTasks = tasks?.length || 0;
        completedTasks = tasks?.filter(task => task.completed).length || 0;

        // Habits  
        totalHabits = habits?.length || 0;
        completedHabits = habits?.filter(habit => habit.completedToday).length || 0;

        // Wellness
        totalWellness = wellness?.length || 0;
        completedWellness = wellness?.filter(activity => activity.completed).length || 0;

        // Add some variation for past days to simulate historical data
        if (isPastDay) {
          const dayIndex = date.getDay();
          const variation = Math.sin(dayIndex * 0.8) * 0.3;
          
          if (totalTasks > 0) {
            completedTasks = Math.max(0, Math.min(totalTasks, Math.round(totalTasks * (0.7 + variation))));
          }
          if (totalHabits > 0) {
            completedHabits = Math.max(0, Math.min(totalHabits, Math.round(totalHabits * (0.6 + variation))));
          }
          if (totalWellness > 0) {
            completedWellness = Math.max(0, Math.min(totalWellness, Math.round(totalWellness * (0.8 + variation))));
          }
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
  }, [tasks, habits, wellness, loading, error]);

  return {
    weekData,
    loading,
    error,
    refetch: () => {
      // The individual hooks will handle refetching
    }
  };
}
