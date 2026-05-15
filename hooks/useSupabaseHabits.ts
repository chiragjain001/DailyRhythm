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

      const [habitsRes, completionsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_completions')
          .select('habit_id')
          .eq('user_id', user.id)
          .eq('completion_date', localDateStr)
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (completionsRes.error) throw completionsRes.error;
      
      if (habitsRes.data) {
        const completedHabitIds = new Set((completionsRes.data || []).map(c => c.habit_id));
        const mappedHabits = habitsRes.data.map((h: any) => ({
          ...h,
          streak: h.current_streak || 0,
          completedToday: completedHabitIds.has(h.id),
        }));
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

    let habitsChannel: ReturnType<typeof supabase.channel>;
    let completionsChannel: ReturnType<typeof supabase.channel>;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      habitsChannel = supabase
        .channel('habits_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
          () => fetchHabits(false)
        )
        .subscribe();
        
      completionsChannel = supabase
        .channel('habit_completions_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habit_completions', filter: `user_id=eq.${user.id}` },
          () => fetchHabits(false)
        )
        .subscribe();
    });

    return () => {
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
      console.error(err);
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
      const newStreak = newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
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
        const { error: insertError } = await supabase.from('habit_completions').upsert({
          user_id: user.id,
          habit_id: id,
          completion_date: localDateStr
        }, {
          onConflict: 'user_id,habit_id,completion_date'
        });
        if (insertError) throw insertError;
      } else {
        const { error: deleteError } = await supabase.from('habit_completions')
          .delete()
          .match({ user_id: user.id, habit_id: id, completion_date: localDateStr });
        if (deleteError) throw deleteError;
      }
    } catch (err: any) {
      console.error(err);
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
      console.error(err);
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
