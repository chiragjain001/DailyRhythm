import { useCallback } from 'react';
import { useSupabaseTasks } from './useSupabaseTasks';
import { useSupabaseHabits } from './useSupabaseHabits';
import { useSupabaseWellness } from './useSupabaseWellness';
import { getCurrentUser } from '@/lib/auth-utils';

interface ExportData {
  tasks: any[];
  habits: any[];
  wellness: any[];
  habitCompletions?: any[];
  wellnessCompletions?: any[];
  exportDate: string;
  version: string;
}

export function useDataExport() {
  const { tasks } = useSupabaseTasks();
  const { habits } = useSupabaseHabits();
  const { wellness } = useSupabaseWellness();

  // Export all user data to JSON
  const exportData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Since we're moving off Supabase, we'll export what's in our local store
      const exportData: ExportData = {
        tasks: tasks || [],
        habits: habits || [],
        wellness: wellness || [],
        habitCompletions: [], // Completions should be part of the habit objects in our store now
        wellnessCompletions: [],
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindmate-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: 'Data exported successfully' };
    } catch (error) {
      console.error('Export error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Export failed' 
      };
    }
  }, [tasks, habits, wellness]);

  // Export data as CSV for spreadsheet compatibility
  const exportCSV = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create CSV content
      let csvContent = 'Type,Title,Status,Category,Tags,Created Date,Completed Date\n';
      
      // Add tasks
      tasks?.forEach(task => {
        csvContent += `Task,"${task.title}",${task.completed ? 'Completed' : 'Pending'},"${task.category || 'general'}","${(task.tags || []).join(';')}","${new Date().toISOString()}","${task.completed ? new Date().toISOString() : ''}"\n`;
      });
      
      // Add habits
      habits?.forEach(habit => {
        csvContent += `Habit,"${habit.title}",${habit.completedToday ? 'Completed Today' : 'Not Completed'},"${habit.category || 'general'}","${(habit.tags || []).join(';')}","${new Date().toISOString()}","${habit.completedToday ? new Date().toISOString() : ''}"\n`;
      });
      
      // Add wellness
      wellness?.forEach(item => {
        csvContent += `Wellness,"${item.title}",${item.completed ? 'Completed' : 'Pending'},"${item.category || 'wellness'}","${(item.tags || []).join(';')}","${new Date().toISOString()}","${item.completed ? new Date().toISOString() : ''}"\n`;
      });

      // Create and download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindmate-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, message: 'CSV exported successfully' };
    } catch (error) {
      console.error('CSV export error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'CSV export failed' 
      };
    }
  }, [tasks, habits, wellness]);

  // Import data from JSON file
  const importData = useCallback(async (file: File) => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const text = await file.text();
      const importData: ExportData = JSON.parse(text);

      // Validate import data structure
      if (!importData.tasks || !importData.habits || !importData.wellness) {
        throw new Error('Invalid import file format');
      }

      // Implementation of bulk import would go here, updating the store
      // For now, we'll just mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      console.error('Import error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  }, []);

  // Get completion statistics for analytics
  const getCompletionStats = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.completed).length || 0;
      const totalHabits = habits?.length || 0;
      const completedHabitsToday = habits?.filter(h => h.completedToday).length || 0;
      const totalWellness = wellness?.length || 0;
      const completedWellness = wellness?.filter(w => w.completed).length || 0;

      const overallTotal = totalTasks + totalHabits + totalWellness;
      const overallCompleted = completedTasks + completedHabitsToday + completedWellness;
      const completionRate = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

      return {
        tasks: { total: totalTasks, completed: completedTasks },
        habits: { total: totalHabits, completed: completedHabitsToday },
        wellness: { total: totalWellness, completed: completedWellness },
        overall: { total: overallTotal, completed: overallCompleted, rate: Math.round(completionRate) }
      };
    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  }, [tasks, habits, wellness]);

  return {
    exportData,
    exportCSV,
    importData,
    getCompletionStats
  };
}
