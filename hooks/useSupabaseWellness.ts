import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { WellnessItem } from '@/store/use-mindmate-store';

export function useSupabaseWellness() {
  const [wellness, setWellness] = useState<WellnessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const router = useRouter();

  // Load wellness activities from database
  const loadWellnessActivities = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('wellness_checklist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      let currentData = data || [];

      // Auto-seed logic: if user has no activities, create default presets instantly
      if (!error && currentData.length === 0) {
        const defaultItems = [
          { user_id: user.id, activity: "Deep breathing", completed: false },
          { user_id: user.id, activity: "Morning walk", completed: false },
          { user_id: user.id, activity: "Drink water", completed: false },
          { user_id: user.id, activity: "Read book", completed: false },
          { user_id: user.id, activity: "Call friend", completed: false },
          { user_id: user.id, activity: "Doodle sketch", completed: false }
        ];

        const { data: seededData, error: seedError } = await supabase
          .from('wellness_checklist')
          .insert(defaultItems)
          .select();

        if (!seedError && seededData) {
          currentData = seededData;
        }
      }

      const items = currentData.map(w => ({
        id: w.id,
        title: w.activity, // Map DB field 'activity' to UI field 'title'
        completed: w.completed
      } as WellnessItem));
      
      setWellness(items);
      
      // Calculate completion percentage
      // Calculate completion percentage capped at required goal of 4
      const REQUIRED_GOAL = 4;
      const rawCompletedCount = items.filter(item => item.completed).length;
      const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
      setCompletionPercentage(Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100));
      
      setError(null);
    } catch (err) {
      console.error('Error loading wellness activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wellness activities');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Toggle wellness activity completion
  const toggleWellness = useCallback(async (id: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const activity = wellness.find(w => w.id === id);
      if (!activity) return;

      // Optimistic update
      const updatedWellness = wellness.map(w => 
        w.id === id ? { ...w, completed: !w.completed } : w
      );
      setWellness(updatedWellness);
      
      // Set target requirement to 4 as requested, and cap completion count at 4
      const REQUIRED_GOAL = 4;
      const rawCompletedCount = updatedWellness.filter(item => item.completed).length;
      const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
      setCompletionPercentage(Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100));

      const { error } = await supabase
        .from('wellness_checklist')
        .update({ completed: !activity.completed })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } catch (err) {
      // Revert optimistic update on error
      const revertedWellness = wellness.map(w => 
        w.id === id ? { ...w, completed: w.completed } : w
      );
      setWellness(revertedWellness);
      
      // Reset completion percent on error using fixed target
      const REQUIRED_GOAL = 4;
      const rawCompletedCount = revertedWellness.filter(item => item.completed).length;
      const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
      setCompletionPercentage(Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100));
      
      console.error('Error toggling wellness activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle wellness activity');
      throw err;
    }
  }, [wellness]);

  // Set up real-time subscription for completion changes
  useEffect(() => {
    let channel: any;
    
    const setupRealtimeSubscription = async () => {
      await loadWellnessActivities();
      
      // Get current user for filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to real-time changes in wellness_checklist
      const uniqueId = Math.random().toString(36).substring(7);
      channel = supabase
        .channel(`wellness_checklist_changes_${uniqueId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'wellness_checklist',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('🔄 Real-time wellness change detected');
          loadWellnessActivities();
        })
        .subscribe();
    };
    
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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
