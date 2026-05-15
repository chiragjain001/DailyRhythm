import { useCallback, useEffect, useState } from 'react';
import { useMindmateStore, Task } from '@/store/use-mindmate-store';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';

export function useSupabaseTasks() {
  const selectedDate = useMindmateStore(state => state.selectedDate);
  const tasks = useMindmateStore(state => state.tasks);
  const setTasks = useMindmateStore(state => state.setTasks);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localDateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchTasks = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [tasksRes, completionsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', user.id)
          .eq('completion_date', localDateStr)
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (completionsRes.error) throw completionsRes.error;

      if (tasksRes.data) {
        const completedTaskIds = new Set((completionsRes.data || []).map(c => c.task_id));
        const mappedTasks = tasksRes.data.map((t: any) => ({
          ...t,
          completed: completedTaskIds.has(t.id),
        }));
        setTasks(mappedTasks);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [setTasks, localDateStr]);

  useEffect(() => {
    fetchTasks();

    let tasksChannel: ReturnType<typeof supabase.channel>;
    let completionsChannel: ReturnType<typeof supabase.channel>;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      tasksChannel = supabase
        .channel('tasks_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
          () => fetchTasks(false)
        )
        .subscribe();
        
      completionsChannel = supabase
        .channel('task_completions_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'task_completions', filter: `user_id=eq.${user.id}` },
          () => fetchTasks(false)
        )
        .subscribe();
    });

    return () => {
      if (tasksChannel) supabase.removeChannel(tasksChannel);
      if (completionsChannel) supabase.removeChannel(completionsChannel);
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
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      if (data) setTasks(prev => [{ ...data, completed: false }, ...prev]);
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
      const localDateStr = format(selectedDate, 'yyyy-MM-dd');

      setTasks(prev => prev.map(t =>
        t.id === id ? { ...t, completed: newCompleted, progress: newCompleted ? 1 : t.progress } : t
      ));

      if (newCompleted) {
        const { error } = await supabase.from('task_completions').upsert({
          user_id: user.id,
          task_id: id,
          completion_date: localDateStr
        }, {
          onConflict: 'user_id,task_id,completion_date'
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_completions')
          .delete()
          .match({ user_id: user.id, task_id: id, completion_date: localDateStr });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error(err);
      fetchTasks();
    }
  }, [tasks, setTasks, localDateStr, fetchTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: new Date().toISOString() })
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
