import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, WellnessItem } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_WELLNESS: Pick<WellnessItem, 'title' | 'completed'>[] = [
  { title: 'Deep breathing', completed: false },
  { title: 'Morning walk', completed: false },
  { title: 'Drink water', completed: false },
  { title: 'Read book', completed: false },
  { title: 'Call friend', completed: false },
  { title: 'Doodle sketch', completed: false },
];

const REQUIRED_GOAL = 4;

export function useSupabaseWellness() {
  const wellness = useMindmateStore(state => state.wellness);
  const setWellness = useMindmateStore(state => state.setWellness);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWellness = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('wellness_checklist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        // --- Auto Self-Healing Deduplication ---
        const seen = new Set<string>();
        const uniqueData: any[] = [];
        const duplicatesToDelete: string[] = [];
        
        data.forEach((w: any) => {
          const titleKey = (w.activity || '').trim().toLowerCase();
          if (seen.has(titleKey)) {
            duplicatesToDelete.push(w.id);
          } else {
            seen.add(titleKey);
            uniqueData.push(w);
          }
        });

        const mapped = uniqueData.map((w: any) => ({
          ...w,
          title: w.activity,
        }));
        setWellness(mapped);

        // Clean up extra phantom rows from the DB in background
        if (duplicatesToDelete.length > 0) {
          supabase
            .from('wellness_checklist')
            .delete()
            .in('id', duplicatesToDelete)
            .then(({ error }) => {
              if (!error) {
                console.log(`[Self-Healing] Successfully pruned ${duplicatesToDelete.length} duplicate wellness checklist items.`);
              }
            });
        }
      } else {
        // Seed default items in DB
        const toInsert = DEFAULT_WELLNESS.map(item => ({
          user_id: user.id,
          activity: item.title,
          completed: item.completed,
        }));
        
        const { data: insertedData, error: insertError } = await supabase
          .from('wellness_checklist')
          .insert(toInsert)
          .select();
          
        if (insertError) throw insertError;
        if (insertedData) {
          const mapped = insertedData.map((w: any) => ({
            ...w,
            title: w.activity,
          }));
          setWellness(mapped);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setWellness]);

  useEffect(() => {
    fetchWellness();

    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel('wellness_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wellness_checklist', filter: `user_id=eq.${user.id}` },
          () => {
            fetchWellness(false);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchWellness]);

  const toggleWellness = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const item = wellness.find(w => w.id === id);
      if (!item) return;
      
      const newCompleted = !item.completed;

      // Optimistic
      setWellness(prev => prev.map(w => w.id === id ? { ...w, completed: newCompleted } : w));

      const { error } = await supabase
        .from('wellness_checklist')
        .update({ completed: newCompleted })
        .eq('id', id);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      if (newCompleted) {
        await supabase.from('wellness_completions').insert({
          user_id: user.id,
          activity_title: item.title,
          completion_date: today
        });
      } else {
        await supabase.from('wellness_completions')
          .delete()
          .match({ activity_title: item.title, completion_date: today, user_id: user.id });
      }
    } catch (err: any) {
      console.error(err);
      fetchWellness();
    }
  }, [wellness, setWellness, fetchWellness]);

  const rawCompletedCount = wellness.filter(item => item.completed).length;
  const cappedCompletedCount = Math.min(rawCompletedCount, REQUIRED_GOAL);
  const completionPercentage = Math.round((cappedCompletedCount / REQUIRED_GOAL) * 100);

  return {
    wellness,
    loading,
    error,
    completionPercentage,
    toggleWellness,
    refetch: fetchWellness,
  };
}
