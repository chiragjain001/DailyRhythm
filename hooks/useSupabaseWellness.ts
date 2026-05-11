import { useCallback } from 'react';
import { useMindmateStore, WellnessItem } from '@/store/use-mindmate-store';

const DEFAULT_WELLNESS: WellnessItem[] = [
  { id: 'w1', title: 'Deep breathing', completed: false },
  { id: 'w2', title: 'Morning walk', completed: false },
  { id: 'w3', title: 'Drink water', completed: false },
  { id: 'w4', title: 'Read book', completed: false },
  { id: 'w5', title: 'Call friend', completed: false },
  { id: 'w6', title: 'Doodle sketch', completed: false },
];

const REQUIRED_GOAL = 4;

/**
 * Wellness hook — operates entirely on the Zustand global store (persisted to
 * localStorage).  No API calls are made; data survives page refreshes via
 * Zustand's persist middleware.
 *
 * Seeds default items if the store is empty.
 */
export function useSupabaseWellness() {
  const wellness = useMindmateStore(state => state.wellness);
  const setWellness = useMindmateStore(state => state.setWellness);

  // Seed defaults if store is empty (first load)
  const items = wellness.length > 0 ? wellness : DEFAULT_WELLNESS;
  if (wellness.length === 0) {
    // Schedule outside render to avoid React state-during-render warning
    setTimeout(() => setWellness(DEFAULT_WELLNESS), 0);
  }

  const rawCompletedCount = items.filter(item => item.completed).length;
  const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
  const completionPercentage = Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100);

  const toggleWellness = useCallback((id: string) => {
    setWellness(prev => {
      const base = prev.length > 0 ? prev : DEFAULT_WELLNESS;
      return base.map(w => w.id === id ? { ...w, completed: !w.completed } : w);
    });
  }, [setWellness]);

  return {
    wellness: items,
    loading: false,
    error: null,
    completionPercentage,
    toggleWellness,
    refetch: () => {},
  };
}
