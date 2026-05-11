import { useEffect, useState, useCallback } from 'react';
import { useMindmateStore, WellnessItem } from '@/store/use-mindmate-store';

export function useSupabaseWellness() {
  const wellness = useMindmateStore(state => state.wellness);
  const setWellness = useMindmateStore(state => state.setWellness);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Derive completion dynamically
  const REQUIRED_GOAL = 4;
  const rawCompletedCount = wellness.filter(item => item.completed).length;
  const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
  const completionPercentage = Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100);

  // Load wellness activities from custom API
  const loadWellnessActivities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wellness');
      if (!res.ok) throw new Error('Failed to fetch wellness data');
      const data = await res.json();
      let items = data.items || [];
      
      // Default fallback if no activities exist
      if (items.length === 0) {
        items = [
          { id: '1', title: "Deep breathing", completed: false },
          { id: '2', title: "Morning walk", completed: false },
          { id: '3', title: "Drink water", completed: false },
          { id: '4', title: "Read book", completed: false },
          { id: '5', title: "Call friend", completed: false },
          { id: '6', title: "Doodle sketch", completed: false }
        ];
      }
      
      setWellness(items);
      setError(null);
    } catch (err) {
      console.error('Error loading wellness activities:', err);
      // Setup mock data in case API endpoint is unhandled so UI works during dev
      const items = [
        { id: '1', title: "Deep breathing", completed: false },
        { id: '2', title: "Morning walk", completed: false },
        { id: '3', title: "Drink water", completed: false },
        { id: '4', title: "Read book", completed: false },
        { id: '5', title: "Call friend", completed: false },
        { id: '6', title: "Doodle sketch", completed: false }
      ];
      setWellness(items);
      setError(err instanceof Error ? err.message : 'Failed to load wellness activities');
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle wellness activity completion
  const toggleWellness = useCallback(async (id: string) => {
    const activity = wellness.find(w => w.id === id);
    if (!activity) return;

    // Optimistic update
    const updatedWellness = wellness.map(w => 
      w.id === id ? { ...w, completed: !w.completed } : w
    );
    setWellness(updatedWellness);

    try {
      const res = await fetch(`/api/wellness/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !activity.completed }),
      });
      if (!res.ok) throw new Error('Failed to update wellness activity');
    } catch (err) {
      // Revert optimistic update
      setWellness(wellness);
      setError(err instanceof Error ? err.message : 'Failed to toggle wellness activity');
      throw err;
    }
  }, [wellness]);

  useEffect(() => {
    loadWellnessActivities();
  }, [loadWellnessActivities]);

  return {
    wellness,
    loading,
    error,
    completionPercentage,
    toggleWellness,
    refetch: loadWellnessActivities
  };
}
