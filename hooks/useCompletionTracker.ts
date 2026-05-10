import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseTasks } from './useSupabaseTasks';
import { useSupabaseHabits } from './useSupabaseHabits';
import { useSupabaseWellness } from './useSupabaseWellness';

export interface CompletionData {
  // Total counts
  totalItems: number;
  completedItems: number;
  
  // Main completion percentage
  completionPercentage: number;
  
  // Breakdown by type
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
  
  // Status flags
  isLoading: boolean;
  hasItems: boolean;
  isFullyCompleted: boolean;
}

/**
 * Unified completion tracking hook
 * Calculates completion percentage across tasks, habits, and wellness activities
 * Formula: completion_percentage = (completed_items / total_items) * 100
 */
export function useCompletionTracker(): CompletionData {
  // Get data from individual hooks (already user-isolated)
  const { tasks, loading: tasksLoading } = useSupabaseTasks();
  const { habits, loading: habitsLoading } = useSupabaseHabits();
  const { wellness, completionPercentage: wellnessCompletionPercentage = 0, loading: wellnessLoading } = useSupabaseWellness();
  
  // Force re-calculation trigger for real-time updates
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Trigger updates when any data changes
  useEffect(() => {
    setUpdateTrigger(prev => prev + 1);
  }, [tasks, habits, wellness]);
  
  // Main completion calculation
  const completionData: CompletionData = useMemo(() => {
    // Handle loading state
    const isLoading = tasksLoading || habitsLoading || wellnessLoading;
    
    if (isLoading) {
      return {
        totalItems: 0,
        completedItems: 0,
        completionPercentage: 0,
        breakdown: {
          tasks: { total: 0, completed: 0, percentage: 0 },
          habits: { total: 0, completed: 0, percentage: 0 },
          wellness: { total: 0, completed: 0, percentage: 0 }
        },
        isLoading: true,
        hasItems: false,
        isFullyCompleted: false
      };
    }
    
    // Calculate tasks completion
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(task => task.completed).length || 0;
    const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate habits completion (daily completion status)
    const totalHabits = habits?.length || 0;
    const completedHabits = habits?.filter(habit => habit.completedToday).length || 0;
    const habitPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    
    // Calculate wellness completion capped at 4 target
    const REQUIRED_WELLNESS = 4;
    const totalWellness = REQUIRED_WELLNESS; 
    const rawCompletedWellness = wellness?.filter(activity => activity.completed).length || 0;
    const completedWellness = Math.min(rawCompletedWellness, REQUIRED_WELLNESS);
    
    // Use the wellness completion percentage from the hook
    const wellnessPercentage = wellnessCompletionPercentage || 0;
    
    // Calculate overall totals
    const totalItems = totalTasks + totalHabits + totalWellness;
    const completedItems = completedTasks + completedHabits + completedWellness;
    
    // Calculate overall completion percentage
    // Formula: completion_percentage = (completed_items / total_items) * 100
    const completionPercentage = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100) 
      : 0;
    
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
      },
      isLoading: false,
      hasItems: totalItems > 0,
      isFullyCompleted: completionPercentage === 100 && totalItems > 0
    };
  }, [tasks, habits, wellness, wellnessCompletionPercentage, tasksLoading, habitsLoading, wellnessLoading, updateTrigger]);
  
  // Log completion updates for debugging
  useEffect(() => {
    if (!completionData.isLoading && completionData.hasItems) {
      console.log('🔄 Completion Update:', {
        timestamp: new Date().toISOString(),
        totalItems: completionData.totalItems,
        completedItems: completionData.completedItems,
        completionPercentage: completionData.completionPercentage,
        breakdown: completionData.breakdown,
        isFullyCompleted: completionData.isFullyCompleted
      });
    }
  }, [completionData]);
  
  return completionData;
}

/**
 * Hook for triggering manual completion updates
 * Useful for forcing recalculation after external changes
 */
export function useCompletionUpdater() {
  const [, setTrigger] = useState(0);
  
  const triggerUpdate = useCallback(() => {
    setTrigger(prev => prev + 1);
    console.log('🔄 Manual completion update triggered');
  }, []);
  
  return { triggerUpdate };
}
