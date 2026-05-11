import { useEffect, useState, useCallback } from 'react';
import { useMindmateStore, Habit } from '@/store/use-mindmate-store';

export function useSupabaseHabits() {
  const habits = useMindmateStore(state => state.habits);
  const setHabits = useMindmateStore(state => state.setHabits);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch habits from custom backend
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/habits');
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      setHabits(data.habits || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch habits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new habit
  const addHabit = useCallback(async (habitProps: Pick<Habit, 'title' | 'note' | 'time'>) => {
    try {
      // Optimistic update
      const tempId = 'temp_' + Date.now();
      const newHabit = {
        id: tempId,
        title: habitProps.title,
        note: habitProps.note || '',
        time: habitProps.time || '',
        streak: 0,
        completedToday: false
      } as Habit;
      setHabits(prev => [newHabit, ...prev]);

      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habitProps),
      });
      if (!res.ok) throw new Error('Failed to add habit');
      const data = await res.json();
      
      setHabits(prev => prev.map(h => h.id === tempId ? data.habit : h));
      return data.habit;
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

    // Optimistic update
    const optimisticUpdate = {
      ...habitToUpdate,
      completedToday: !habitToUpdate.completedToday,
      streak: !habitToUpdate.completedToday ? habitToUpdate.streak + 1 : Math.max(0, habitToUpdate.streak - 1)
    };
    setHabits(prev => prev.map(h => h.id === id ? optimisticUpdate : h));

    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !habitToUpdate.completedToday }),
      });
      if (!res.ok) throw new Error('Failed to update habit');
    } catch (err) {
      // Revert optimistic update
      setHabits(prev => prev.map(h => h.id === id ? habitToUpdate : h));
      setError(err instanceof Error ? err.message : 'Failed to toggle habit');
      throw err;
    }
  }, [habits]);

  // Delete a habit
  const deleteHabit = useCallback(async (id: string) => {
    try {
      setHabits(prev => prev.filter(habit => habit.id !== id));
      const res = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete habit');
    } catch (err) {
      console.error('Error deleting habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete habit');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchHabits();
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
