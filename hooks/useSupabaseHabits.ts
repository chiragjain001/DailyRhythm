import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, Habit } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

export function useSupabaseHabits() {
  const selectedDate = useMindmateStore(state => state.selectedDate);
  const habits = useMindmateStore(state => state.habits);
  const setHabits = useMindmateStore(state => state.setHabits);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localDateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchHabits = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      const [habitsRes, completionsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_completions')
          .select('habit_id, completion_date')
          .eq('user_id', user.id)
          .in('completion_date', [localDateStr, yesterdayStr])
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (completionsRes.error) throw completionsRes.error;
      
      if (habitsRes.data) {
        const completions = completionsRes.data || [];
        const todayCompletedIds = new Set(completions.filter(c => c.completion_date === localDateStr).map(c => c.habit_id));
        const yesterdayCompletedIds = new Set(completions.filter(c => c.completion_date === yesterdayStr).map(c => c.habit_id));
        
        const mappedHabits = habitsRes.data.map((h: any) => {
          const completedToday = todayCompletedIds.has(h.id);
          const completedYesterday = yesterdayCompletedIds.has(h.id);
          let streak = h.current_streak || 0;

          // Enforce 24-hour gap rule: if not completed today AND not completed yesterday, the streak is broken
          if (!completedToday && !completedYesterday && streak > 0) {
            streak = 0;
            // Update db async to reflect broken streak
            supabase.from('habits').update({ current_streak: 0 }).eq('id', h.id).then();
          }

          return {
            ...h,
            streak,
            completedToday,
          };
        });
        setHabits(mappedHabits);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setHabits, localDateStr]);

  useEffect(() => {
    fetchHabits();

    let isMounted = true;
    let habitsChannel: ReturnType<typeof supabase.channel>;
    let completionsChannel: ReturnType<typeof supabase.channel>;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted) return;
      
      const instanceId = Math.random().toString(36).slice(2, 9);

      habitsChannel = supabase
        .channel(`habits_realtime_${instanceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
          () => fetchHabits(false)
        )
        .subscribe();
        
      completionsChannel = supabase
        .channel(`habit_completions_realtime_${instanceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habit_completions', filter: `user_id=eq.${user.id}` },
          () => fetchHabits(false)
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (habitsChannel) supabase.removeChannel(habitsChannel);
      if (completionsChannel) supabase.removeChannel(completionsChannel);
    };
  }, [fetchHabits]);

  const addHabit = useCallback(async (habitProps: Pick<Habit, 'title' | 'note' | 'time'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const newHabit = {
        user_id: user.id,
        title: habitProps.title,
        note: habitProps.note || '',
        time: habitProps.time || '',
        current_streak: 0,
        longest_streak: 0,
      };

      const { data, error } = await supabase
        .from('habits')
        .insert([newHabit])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped = {
          ...data,
          streak: data.current_streak || 0,
          completedToday: false,
        };
        setHabits(prev => [mapped, ...prev]);
        return mapped;
      }
    } catch (err: any) {
      console.warn('Add habit failed:', err?.message || err);
      return null;
    }
  }, [setHabits]);

  const toggleHabit = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const habit = habits.find(h => h.id === id);
      if (!habit) return;
      
      const newCompleted = !habit.completedToday;
      
      // Calculate true streak (add if newly marked, subtract if unmarking)
      let newStreak = habit.streak;
      if (newCompleted) {
        newStreak = habit.streak + 1;
      } else {
        newStreak = Math.max(0, habit.streak - 1);
      }
      
      const localDateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const mappedHabit = {
        ...habit,
        completedToday: newCompleted,
        streak: newStreak
      };

      setHabits(prev => prev.map(h => h.id === id ? mappedHabit : h));

      const { error } = await supabase
        .from('habits')
        .update({
          current_streak: newStreak,
        })
        .eq('id', id);

      if (error) throw error;

      if (newCompleted) {
        // Safe insert logic bypassing unique constraint requirement
        const { data: existing } = await supabase.from('habit_completions').select('id').match({
          user_id: user.id,
          habit_id: id,
          completion_date: localDateStr
        }).maybeSingle();

        if (!existing) {
          const { error: insertError } = await supabase.from('habit_completions').insert({
            user_id: user.id,
            habit_id: id,
            completion_date: localDateStr,
            local_date: localDateStr
          });
          if (insertError) throw insertError;
        }
      } else {
        const { error: deleteError } = await supabase.from('habit_completions')
          .delete()
          .match({ user_id: user.id, habit_id: id, completion_date: localDateStr });
        if (deleteError) throw deleteError;
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update habit';
      console.warn('Habit update failed:', errorMsg);
      // Revert optimistic update by refetching
      fetchHabits();
    }
  }, [habits, setHabits, localDateStr, fetchHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      setHabits(prev => prev.filter(h => h.id !== id));
      
      const { error } = await supabase
        .from('habits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.warn('Delete habit failed:', err?.message || err);
      fetchHabits();
    }
  }, [setHabits, fetchHabits]);

  return {
    habits,
    loading,
    error,
    addHabit,
    toggleHabit,
    deleteHabit,
    refetch: fetchHabits,
  };
}
