import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { useMindmateStore } from '@/store/use-mindmate-store';

export interface WeeklyDayData {
  date: Date;
  dayName: string;
  dayShort: string;
  dateLabel: string;
  completedTasks: number;
  totalTasks: number;
  completedHabits: number;
  totalHabits: number;
  completedWellness: number;
  totalWellness: number;
  completionPercentage: number;
  isCurrentDay: boolean;
  isPastDay: boolean;
  isFutureDay: boolean;
}

export function useWeeklyCompletionData() {
  const tasks = useMindmateStore(state => state.tasks);
  const habits = useMindmateStore(state => state.habits);
  const wellness = useMindmateStore(state => state.wellness);

  const [weekData, setWeekData] = useState<WeeklyDayData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Keep track of the latest fetch request ID to handle network race conditions
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });     // Sunday
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const { data: { user } } = await supabase.auth.getUser();
      
      // If a newer fetch has started while we were getting the user, stop immediately
      if (currentFetchId !== fetchIdRef.current) return;

      let dbTasks: any[] = [];
      let dbHabits: any[] = [];
      let dbWellness: any[] = [];
      
      if (user) {
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        const [tRes, hRes, wRes] = await Promise.all([
          supabase.from('task_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
          supabase.from('habit_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
          supabase.from('wellness_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
        ]);
        
        // If a newer fetch started while we were waiting for the database, abort
        if (currentFetchId !== fetchIdRef.current) return;

        dbTasks = tRes.data || [];
        dbHabits = hRes.data || [];
        dbWellness = wRes.data || [];
      }

      const compMap: Record<string, { t: number, h: number, w: number }> = {};
      daysInWeek.forEach(d => {
        compMap[format(d, 'yyyy-MM-dd')] = { t: 0, h: 0, w: 0 };
      });

      dbTasks.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].t++; });
      dbHabits.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].h++; });
      dbWellness.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].w++; });

      const totalHabitsCount = habits?.length || 0;

      const processedData = daysInWeek.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
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
          if (isCurrentDay) {
            totalTasks = (tasks || []).length;
            completedTasks = (tasks || []).filter(t => t.completed).length;

            totalWellness = 4;
            completedWellness = Math.min((wellness || []).filter(w => w.completed).length, 4);
            
            totalHabits = (habits || []).length;
            completedHabits = (habits || []).filter(h => h.completedToday).length;
          } else {
            // Read EXACT historical completions directly from the database!
            completedTasks = compMap[dateStr]?.t || 0;
            completedHabits = compMap[dateStr]?.h || 0;
            completedWellness = Math.min(compMap[dateStr]?.w || 0, 4);
            
            // Dynamic totals: only count tasks/habits that existed on or before this day
            const dayEnd = endOfDay(date);
            
            let dayTotalTasks = (tasks || []).filter(t => {
               const createdAt = (t as any).createdAt || (t as any).created_at;
               if (!createdAt) return true;
               return new Date(createdAt) <= dayEnd;
            }).length;
            
            let dayTotalHabits = (habits || []).filter(h => {
               const createdAt = (h as any).createdAt || (h as any).created_at;
               if (!createdAt) return true;
               return new Date(createdAt) <= dayEnd;
            }).length;

            // Ensure total isn't accidentally smaller than completed due to deleted items
            totalTasks = Math.max(completedTasks, dayTotalTasks);
            totalHabits = Math.max(completedHabits, dayTotalHabits);
            totalWellness = 4; // Wellness goal is permanently fixed at 4
          }
        }

        const totalItems = totalTasks + totalHabits + totalWellness;
        const completedItems = completedTasks + completedHabits + completedWellness;
        const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
          date,
          dayName: format(date, 'EEEE'),
          dayShort: format(date, 'EEE'),
          dateLabel: format(date, 'MMM d'),
          completedTasks,
          totalTasks,
          completedHabits,
          totalHabits,
          completedWellness,
          totalWellness,
          completionPercentage,
          isCurrentDay,
          isPastDay,
          isFutureDay,
        };
      });

      // Final check to make sure no other fetch superseded this one
      if (currentFetchId === fetchIdRef.current) {
        setWeekData(processedData);
      }
    } catch (err) {
      if (currentFetchId === fetchIdRef.current) {
        console.error(err);
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [tasks, habits, wellness]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { weekData, loading, error: null, refetch: fetchData };
}

