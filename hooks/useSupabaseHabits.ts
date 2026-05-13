import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, Habit } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';

export function useSupabaseHabits() {
  const habits = useMindmateStore(state => state.habits);
  const setHabits = useMindmateStore(state => state.setHabits);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const mappedHabits = data.map((h: any) => ({
          ...h,
          streak: h.current_streak || 0,
          completedToday: h.completed || false,
        }));
        setHabits(mappedHabits);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setHabits]);

  useEffect(() => {
    fetchHabits();

    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel('habits_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
          () => {
            fetchHabits(false);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
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
        completed: false,
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
          completedToday: data.completed || false,
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
      
      const mappedHabit = {
        ...habit,
        completedToday: newCompleted,
        streak: newStreak
      };

      setHabits(prev => prev.map(h => h.id === id ? mappedHabit : h));

      const { error } = await supabase
        .from('habits')
        .update({
          completed: newCompleted,
          current_streak: newStreak,
        })
        .eq('id', id);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      if (newCompleted) {
        await supabase.from('habit_completions').insert({
          user_id: user.id,
          habit_id: id,
          local_date: today,
          completion_date: today,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        });
      } else {
        await supabase.from('habit_completions')
          .delete()
          .match({ habit_id: id, completion_date: today, user_id: user.id });
      }
    } catch (err: any) {
      console.error(err);
      fetchHabits();
    }
  }, [habits, setHabits, fetchHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      setHabits(prev => prev.filter(h => h.id !== id));
      
      // Delete habit completions first to satisfy foreign key constraints
      await supabase.from('habit_completions').delete().eq('habit_id', id);

      const { error } = await supabase
        .from('habits')
        .delete()
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
