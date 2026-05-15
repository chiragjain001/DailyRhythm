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
      
      let rawTasks: any[] = [];
      let rawHabits: any[] = [];
      let rawWellness: any[] = [];
      
      if (user) {
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

        const [tRes, hRes, wRes, rawTasksRes, rawHabitsRes, rawWellnessRes] = await Promise.all([
          supabase.from('task_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
          supabase.from('habit_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
          supabase.from('wellness_completions').select('completion_date').eq('user_id', user.id).gte('completion_date', weekStartStr).lte('completion_date', weekEndStr),
          supabase.from('tasks').select('id, created_at, deleted_at').eq('user_id', user.id),
          supabase.from('habits').select('id, created_at, deleted_at').eq('user_id', user.id),
          supabase.from('wellness_checklist').select('id, created_at, deleted_at').eq('user_id', user.id)
        ]);
        
        // If a newer fetch started while we were waiting for the database, abort
        if (currentFetchId !== fetchIdRef.current) return;

        dbTasks = tRes.data || [];
        dbHabits = hRes.data || [];
        dbWellness = wRes.data || [];
        
        rawTasks = rawTasksRes.data || [];
        rawHabits = rawHabitsRes.data || [];
        rawWellness = rawWellnessRes.data || [];
      }

      const compMap: Record<string, { t: number, h: number, w: number }> = {};
      daysInWeek.forEach(d => {
        compMap[format(d, 'yyyy-MM-dd')] = { t: 0, h: 0, w: 0 };
      });

      dbTasks.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].t++; });
      dbHabits.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].h++; });
      dbWellness.forEach(row => { if (compMap[row.completion_date]) compMap[row.completion_date].w++; });

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
          // Read EXACT historical completions directly from the database for ALL days
          completedTasks = compMap[dateStr]?.t || 0;
          completedHabits = compMap[dateStr]?.h || 0;
          completedWellness = Math.min(compMap[dateStr]?.w || 0, 4);
          
          // Dynamic totals: only count items that existed on or before this day and weren't deleted
          const dayEnd = endOfDay(date);
          
          let dayTotalTasks = rawTasks.filter(t => {
             const createdAt = new Date(t.created_at);
             const deletedAt = t.deleted_at ? new Date(t.deleted_at) : null;
             return createdAt <= dayEnd && (!deletedAt || deletedAt > dayEnd);
          }).length;
          
          let dayTotalHabits = rawHabits.filter(h => {
             const createdAt = new Date(h.created_at);
             const deletedAt = h.deleted_at ? new Date(h.deleted_at) : null;
             return createdAt <= dayEnd && (!deletedAt || deletedAt > dayEnd);
          }).length;
          
          let dayTotalWellness = rawWellness.filter(w => {
             const createdAt = new Date(w.created_at);
             const deletedAt = w.deleted_at ? new Date(w.deleted_at) : null;
             return createdAt <= dayEnd && (!deletedAt || deletedAt > dayEnd);
          }).length;

          // Ensure total isn't accidentally smaller than completed due to deleted items
          totalTasks = Math.max(completedTasks, dayTotalTasks);
          totalHabits = Math.max(completedHabits, dayTotalHabits);
          // Wellness goal is permanently fixed at 4 if they had at least 4 active items
          totalWellness = Math.max(completedWellness, Math.min(dayTotalWellness, 4));
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optionally set up real-time listener for the dashboard to auto-update
  useEffect(() => {
    let channel1: ReturnType<typeof supabase.channel> | undefined;
    let channel2: ReturnType<typeof supabase.channel> | undefined;
    let channel3: ReturnType<typeof supabase.channel> | undefined;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      const config = { event: '*' as const, schema: 'public', filter: `user_id=eq.${user.id}` };
      
      channel1 = supabase.channel('task_completions_graph')
        .on('postgres_changes', { ...config, table: 'task_completions' }, () => fetchData())
        .subscribe();
        
      channel2 = supabase.channel('habit_completions_graph')
        .on('postgres_changes', { ...config, table: 'habit_completions' }, () => fetchData())
        .subscribe();
        
      channel3 = supabase.channel('wellness_completions_graph')
        .on('postgres_changes', { ...config, table: 'wellness_completions' }, () => fetchData())
        .subscribe();
    });

    return () => {
      if (channel1) supabase.removeChannel(channel1);
      if (channel2) supabase.removeChannel(channel2);
      if (channel3) supabase.removeChannel(channel3);
    };
  }, [fetchData]);

  return { weekData, loading, error: null, refetch: fetchData };
}

