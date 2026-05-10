import { useState, useEffect, useMemo } from 'react';
import { useSupabaseTasks } from './useSupabaseTasks';
import { useSupabaseHabits } from './useSupabaseHabits';
import { useSupabaseWellness } from './useSupabaseWellness';

interface CompletionStats {
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  breakdown: {
    tasks: {
      total: number;
      completed: number;
      percentage: number;
    };
    habits: {
      total: number;
      completed: number;
      percentage: number;
    };
    wellness: {
      total: number;
      completed: number;
      percentage: number;
    };
  };
}

export function useUnifiedCompletion() {
  const { tasks, loading: tasksLoading } = useSupabaseTasks();
  const { habits, loading: habitsLoading } = useSupabaseHabits();
  const { wellness, completionPercentage: wellnessCompletionPercentage = 0, loading: wellnessLoading } = useSupabaseWellness();

  const [realTimeUpdate, setRealTimeUpdate] = useState(0);

  // Force real-time updates when any data changes
  useEffect(() => {
    setRealTimeUpdate(prev => prev + 1);
  }, [tasks, habits, wellness]);

  const completionStats: CompletionStats = useMemo(() => {
    // Filter today's items only
    const today = new Date().toISOString().split('T')[0];
    
    // Tasks: Filter today's tasks or all tasks (depending on your preference)
    const todaysTasks = tasks?.filter(task => {
      if (!task.createdAt) return true; // Include tasks without date
      const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
      return taskDate === today;
    }) || [];

    // Habits: All habits (daily tracking)
    const todaysHabits = habits || [];

    // Wellness: Today's wellness activities
    const todaysWellness = wellness || [];

    // Calculate completions
    const completedTasks = todaysTasks.filter(task => task.completed).length;
    const completedHabits = todaysHabits.filter(habit => habit.completedToday).length;
    const completedWellness = todaysWellness.filter(activity => activity.completed).length;

    // Calculate totals
    const totalTasks = todaysTasks.length;
    const totalHabits = todaysHabits.length;
    const totalWellness = todaysWellness.length;

    const totalItems = totalTasks + totalHabits + totalWellness;
    const completedItems = completedTasks + completedHabits + completedWellness;

    // Calculate percentages
    const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const habitPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    const wellnessPercentage = totalWellness > 0 ? Math.round((completedWellness / totalWellness) * 100) : 0;

    // Overall completion percentage
    let completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      completedItems,
      completionPercentage,
      breakdown: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          percentage: taskPercentage
        },
        habits: {
          total: totalHabits,
          completed: completedHabits,
          percentage: habitPercentage
        },
        wellness: {
          total: totalWellness,
          completed: completedWellness,
          percentage: wellnessPercentage
        }
      }
    };
  }, [tasks, habits, wellness, wellnessCompletionPercentage, realTimeUpdate]);

  const loading = tasksLoading || habitsLoading || wellnessLoading;

  // Real-time logging function
  const logCompletionUpdate = (type: 'task' | 'habit' | 'wellness', action: 'completed' | 'uncompleted') => {
    console.log(`🔄 Real-time ${type} ${action}:`, {
      timestamp: new Date().toISOString(),
      completionPercentage: completionStats.completionPercentage,
      breakdown: completionStats.breakdown
    });
    
    // Trigger real-time update
    setRealTimeUpdate(prev => prev + 1);
  };

  return {
    ...completionStats,
    loading,
    logCompletionUpdate,
    // Helper functions
    isFullyCompleted: completionStats.completionPercentage >= 100,
    isOverAchieved: false, // No more overachievement, 100% is the max
    hasAnyItems: completionStats.totalItems > 0,
    // Individual completion status
    tasksCompleted: completionStats.breakdown.tasks.percentage === 100,
    habitsCompleted: completionStats.breakdown.habits.percentage === 100,
    wellnessCompleted: completionStats.breakdown.wellness.percentage === 100
  };
}
