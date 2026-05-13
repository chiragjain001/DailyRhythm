import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, Task } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';

export function useSupabaseTasks() {
  const tasks = useMindmateStore(state => state.tasks);
  const setTasks = useMindmateStore(state => state.setTasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTasks(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setTasks]);

  useEffect(() => {
    fetchTasks();

    let channel: ReturnType<typeof supabase.channel>;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel('tasks_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
          () => {
            fetchTasks(false); // Silent background refresh
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = useCallback(async (taskProps: Omit<Task, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const newTask = {
        user_id: user.id,
        title: taskProps.title,
        assignee: taskProps.assignee,
        time: taskProps.time,
        priority: taskProps.priority,
        progress: taskProps.progress || 0,
        completed: taskProps.completed || false,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      if (data) setTasks(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }, [setTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      fetchTasks();
    }
  }, [setTasks, fetchTasks]);

  const toggleTask = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const newCompleted = !task.completed;
      const updates = { completed: newCompleted, progress: newCompleted ? 1 : task.progress };

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, ...updates } : t
      ));

      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Handle completions table
      const today = new Date().toISOString().split('T')[0];
      if (newCompleted) {
        await supabase.from('task_completions').insert({
          user_id: user.id,
          task_id: id,
          completion_date: today
        });
      } else {
        await supabase.from('task_completions')
          .delete()
          .match({ task_id: id, completion_date: today, user_id: user.id });
      }
    } catch (err: any) {
      console.error(err);
      fetchTasks();
    }
  }, [tasks, setTasks, fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      fetchTasks();
    }
  }, [setTasks, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
