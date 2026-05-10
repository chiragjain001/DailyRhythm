import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Habit } from '@/store/use-mindmate-store';
import { useRouter } from 'next/navigation';

export function useSupabaseHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch habits from Supabase
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mappedHabits = (data || []).map(h => ({
        id: h.id,
        title: h.habit, // Map DB field 'habit' to UI field 'title'
        note: '', // Mocked as not in DB
        time: '', // Mocked as not in DB
        streak: h.completed ? 1 : 0, // Mocked based on completed today
        completedToday: h.completed,
      } as Habit));

      setHabits(mappedHabits);
      setError(null);
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Add a new habit
  const addHabit = useCallback(async (habitProps: Pick<Habit, 'title' | 'note' | 'time'>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('habits')
        .insert([{
          user_id: user.id,
          habit: habitProps.title, // Map UI field 'title' to DB field 'habit'
          completed: false
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newHabit: Habit = {
        id: data.id,
        title: data.habit,
        note: habitProps.note || '',
        time: habitProps.time || '',
        streak: 0,
        completedToday: data.completed
      };

      setHabits(prev => [newHabit, ...prev]);
      return newHabit;
    } catch (err) {
      console.error('Error adding habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to add habit');
      throw err;
    }
  }, []);

  // Toggle habit completion
  const toggleHabit = useCallback(async (id: string) => {
    const habitToUpdate = habits.find(h => h.id === id);
    if (!habitToUpdate) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Optimistic update
      const optimisticUpdate = {
        ...habitToUpdate,
        completedToday: !habitToUpdate.completedToday,
        streak: !habitToUpdate.completedToday ? habitToUpdate.streak + 1 : Math.max(0, habitToUpdate.streak - 1)
      };
      
      setHabits(prev => prev.map(h => h.id === id ? optimisticUpdate : h));

      const { error } = await supabase
        .from('habits')
        .update({ completed: !habitToUpdate.completedToday })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

    } catch (err) {
      console.error('Error toggling habit:', err);
      // Revert optimistic update
      setHabits(prev => prev.map(h => h.id === id ? habitToUpdate : h));
      setError(err instanceof Error ? err.message : 'Failed to toggle habit');
      throw err;
    }
  }, [habits]);

  // Delete a habit
  const deleteHabit = useCallback(async (id: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setHabits(prev => prev.filter(habit => habit.id !== id));
    } catch (err) {
      console.error('Error deleting habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
      throw err;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    let habitsChannel: any;

    const setupRealtimeSubscriptions = async () => {
      await fetchHabits();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const uniqueId = Math.random().toString(36).substring(7);
      habitsChannel = supabase
        .channel(`habits_changes_dash_${uniqueId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchHabits();
        })
        .subscribe();
    };

    setupRealtimeSubscriptions();

    return () => {
      if (habitsChannel) {
        supabase.removeChannel(habitsChannel);
      }
    };
  }, [fetchHabits]);

  return {
    habits,
    loading,
    error,
    addHabit,
    toggleHabit,
    deleteHabit,
    refetch: fetchHabits
  };
}
