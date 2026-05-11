import { useCallback } from 'react';
import { useMindmateStore, Habit } from '@/store/use-mindmate-store';

/**
 * Habits hook — operates entirely on the Zustand global store (persisted to
 * localStorage).  No API calls are made; data survives page refreshes via
 * Zustand's persist middleware.
 */
export function useSupabaseHabits() {
  const habits = useMindmateStore(state => state.habits);
  const setHabits = useMindmateStore(state => state.setHabits);

  const addHabit = useCallback((habitProps: Pick<Habit, 'title' | 'note' | 'time'>) => {
    const newHabit: Habit = {
      id: 'habit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: habitProps.title,
      note: habitProps.note || '',
      time: habitProps.time || '',
      streak: 0,
      completedToday: false,
    };
    setHabits(prev => [newHabit, ...prev]);
    return newHabit;
  }, [setHabits]);

  const toggleHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h =>
      h.id === id
        ? {
            ...h,
            completedToday: !h.completedToday,
            streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1),
          }
        : h
    ));
  }, [setHabits]);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  }, [setHabits]);

  return {
    habits,
    loading: false,
    error: null,
    addHabit,
    toggleHabit,
    deleteHabit,
    refetch: () => {},
  };
}
