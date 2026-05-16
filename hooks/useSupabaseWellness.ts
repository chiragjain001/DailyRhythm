import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, WellnessItem } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

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
  const selectedDate = useMindmateStore(state => state.selectedDate);
  const wellness = useMindmateStore(state => state.wellness);
  const setWellness = useMindmateStore(state => state.setWellness);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localDateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchWellness = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [checklistRes, completionsRes] = await Promise.all([
        supabase
          .from('wellness_checklist')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
        supabase
          .from('wellness_completions')
          .select('wellness_id')
          .eq('user_id', user.id)
          .eq('completion_date', localDateStr)
      ]);

      if (checklistRes.error) throw checklistRes.error;
      if (completionsRes.error) throw completionsRes.error;
      
      const data = checklistRes.data;

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

        const completedWellnessIds = new Set((completionsRes.data || []).map(c => c.wellness_id));

        const mapped = uniqueData.map((w: any) => ({
          ...w,
          title: w.activity,
          completed: completedWellnessIds.has(w.id),
        }));
        setWellness(mapped);

        // Clean up extra phantom rows from the DB in background (only on manual refresh to avoid loop)
        if (showLoading && duplicatesToDelete.length > 0) {
          supabase
            .from('wellness_checklist')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', duplicatesToDelete)
            .then(({ error }) => {
              if (!error) {
                console.log(`[Self-Healing] Successfully archived ${duplicatesToDelete.length} duplicate wellness checklist items.`);
              }
            });
        }
      } else {
        // Seed default items in DB
        const toInsert = DEFAULT_WELLNESS.map(item => ({
          user_id: user.id,
          activity: item.title,
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
            completed: false,
          }));
          setWellness(mapped);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setWellness, localDateStr]);

  useEffect(() => {
    fetchWellness();

    let isMounted = true;
    let wellnessChannel: ReturnType<typeof supabase.channel>;
    let completionsChannel: ReturnType<typeof supabase.channel>;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted) return;

      const instanceId = Math.random().toString(36).slice(2, 9);

      wellnessChannel = supabase
        .channel(`wellness_realtime_${instanceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wellness_checklist', filter: `user_id=eq.${user.id}` },
          () => fetchWellness(false)
        )
        .subscribe();

      completionsChannel = supabase
        .channel(`wellness_completions_realtime_${instanceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wellness_completions', filter: `user_id=eq.${user.id}` },
          () => fetchWellness(false)
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (wellnessChannel) supabase.removeChannel(wellnessChannel);
      if (completionsChannel) supabase.removeChannel(completionsChannel);
    };
  }, [fetchWellness]);

  const toggleWellness = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const item = wellness.find(w => w.id === id);
      if (!item) return;
      
      const newCompleted = !item.completed;
      const localDateStr = format(selectedDate, 'yyyy-MM-dd');

      // Optimistic
      setWellness(prev => prev.map(w => w.id === id ? { ...w, completed: newCompleted } : w));

      if (newCompleted) {
        const { data: existing } = await supabase.from('wellness_completions').select('id').match({
          user_id: user.id,
          wellness_id: id,
          completion_date: localDateStr
        }).maybeSingle();

        if (!existing) {
          const { error } = await supabase.from('wellness_completions').insert({
            user_id: user.id,
            wellness_id: id,
            activity_title: item.title,
            completion_date: localDateStr
          });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from('wellness_completions')
          .delete()
          .match({ wellness_id: id, completion_date: localDateStr, user_id: user.id });
        if (error) throw error;
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update wellness activity';
      console.warn('Wellness update failed:', errorMsg);
      // Revert optimistic update by refetching
      fetchWellness();
    }
  }, [wellness, setWellness, localDateStr, fetchWellness]);

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
